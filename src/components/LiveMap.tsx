'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import maplibregl, { type Map as MapLibreMap, type GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useLocale, useTranslations } from 'next-intl';

import AircraftPanel from './AircraftPanel';
import SiteNav from './SiteNav';
import { useLogbook } from './LogbookProvider';
import { iconId, registerPlaneIcons, SELECTED_ICON } from './planeIcons';
import { pickCurrentLeg } from '@/lib/route';
import { silhouetteFor } from '@/lib/aircraft';
import { ALT_BAND_COLOR, altitudeBand, type UnitSystem } from '@/lib/format';
import { destinationPoint, greatCirclePath, viewportRadiusNm } from '@/lib/geo';
import { HUBS } from '@/lib/hubs';
import { localeUnits, type Locale } from '@/i18n/routing';
import type { Aircraft, FlightRoute, FlightsResponse } from '@/lib/types';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/dark';

/** Below this zoom we stop asking for a viewport and sample world hubs instead. */
const WORLD_ZOOM = 4;

/** Aircraft older than this are dropped — the transponder has gone quiet. */
const MAX_AGE_MS = 120_000;

/** Dead reckoning is capped so a stale aircraft cannot drift across the map. */
const MAX_EXTRAPOLATE_S = 45;

const EMPTY_FC = { type: 'FeatureCollection' as const, features: [] };

interface Tracked extends Aircraft {
  /** Browser clock reading when this position arrived. */
  t: number;
}

function pollIntervalMs(zoom: number): number {
  if (zoom < WORLD_ZOOM) return 60_000;
  if (zoom < 7) return 20_000;
  return 10_000;
}

function readHash(): { lat: number; lon: number; zoom: number } | null {
  if (typeof window === 'undefined') return null;
  const m = window.location.hash.match(/^#(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lon = Number(m[2]);
  const zoom = Number(m[3]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(zoom)) return null;
  return { lat, lon, zoom };
}

export default function LiveMap() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const units: UnitSystem = localeUnits[locale] ?? 'imperial';

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const tracksRef = useRef<Map<string, Tracked>>(new Map());
  const selectedIdRef = useRef<string | null>(null);
  const followingRef = useRef(false);
  const trailRef = useRef<[number, number][]>([]);
  const refreshRef = useRef<() => void>(() => {});

  const [styleReady, setStyleReady] = useState(false);
  const [count, setCount] = useState(0);
  const [selected, setSelected] = useState<Aircraft | null>(null);
  const [route, setRoute] = useState<FlightRoute | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [following, setFollowing] = useState(false);
  const [worldMode, setWorldMode] = useState(true);
  const [offline, setOffline] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);

  const { book, spot, ready: bookReady } = useLogbook();

  // -------------------------------------------------------------------------
  // Selection
  // -------------------------------------------------------------------------

  const select = useCallback((id: string | null) => {
    selectedIdRef.current = id;
    trailRef.current = [];
    if (!id) {
      setSelected(null);
      setRoute(null);
      setFollowing(false);
      followingRef.current = false;
      return;
    }
    const a = tracksRef.current.get(id);
    setSelected(a ? { ...a } : null);
  }, []);

  // -------------------------------------------------------------------------
  // Logbook: one sighting per aircraft selection
  // -------------------------------------------------------------------------

  const selectedId = selected?.id ?? null;

  useEffect(() => {
    if (!bookReady || !selectedId) return;
    const a = tracksRef.current.get(selectedId);
    if (a) spot(a);
    // Deliberately keyed on identity only — position updates must not inflate
    // the sighting count.
  }, [selectedId, bookReady, spot]);

  // Fetch the scheduled route whenever the selected callsign changes.
  useEffect(() => {
    const cs = selected?.cs?.trim();
    if (!cs) {
      setRoute(null);
      return;
    }
    let cancelled = false;
    setRouteLoading(true);
    fetch(`/api/flight-route/${encodeURIComponent(cs)}`)
      .then((r) => r.json())
      .then((json: { found: boolean; route?: FlightRoute }) => {
        if (cancelled) return;
        setRoute(json.found && json.route ? json.route : null);
      })
      .catch(() => {
        if (!cancelled) setRoute(null);
      })
      .finally(() => {
        if (!cancelled) setRouteLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // Only the callsign matters; position updates must not refetch.
  }, [selected?.cs]);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const refresh = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;

    const zoom = map.getZoom();
    const isWorld = zoom < WORLD_ZOOM;
    setWorldMode(isWorld);

    let url: string;
    if (isWorld) {
      url = '/api/flights?mode=hubs';
    } else {
      const c = map.getCenter();
      const ne = map.getBounds().getNorthEast();
      const dist = viewportRadiusNm(
        { lon: c.lng, lat: c.lat },
        { lon: ne.lng, lat: ne.lat },
      );
      url = `/api/flights?lat=${c.lat.toFixed(4)}&lon=${c.lng.toFixed(4)}&dist=${dist}`;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`api ${res.status}`);
      const data = (await res.json()) as FlightsResponse;

      const now = Date.now();
      const next = new Map<string, Tracked>();
      for (const a of data.aircraft) next.set(a.id, { ...a, t: now });

      // Keep the selected aircraft visible even if it drifted out of the query
      // area, until its position genuinely goes stale.
      const selId = selectedIdRef.current;
      if (selId && !next.has(selId)) {
        const prev = tracksRef.current.get(selId);
        if (prev && now - prev.t < MAX_AGE_MS) next.set(selId, prev);
      }

      tracksRef.current = next;
      setCount(data.aircraft.length);
      setOffline(false);
      setFirstLoad(false);

      if (selId) {
        const a = next.get(selId);
        setSelected(a ? { ...a } : null);
      }
    } catch {
      setOffline(true);
      setFirstLoad(false);
    }
  }, []);

  refreshRef.current = refresh;

  // -------------------------------------------------------------------------
  // Map setup
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const start = readHash();
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: start ? [start.lon, start.lat] : [30, 25],
      zoom: start ? start.zoom : 1.6,
      minZoom: 1,
      maxZoom: 13,
      attributionControl: false,
      dragRotate: false,
    });
    mapRef.current = map;
    // Debug handle: lets a browser test (or the console) inspect layers
    // and sources without reaching into React internals.
    (window as unknown as { __afaMap?: MapLibreMap }).__afaMap = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.touchZoomRotate.disableRotation();

    map.on('load', async () => {
      await registerPlaneIcons(map);

      map.addSource('route', { type: 'geojson', data: EMPTY_FC });
      map.addSource('trail', { type: 'geojson', data: EMPTY_FC });
      map.addSource('route-ends', { type: 'geojson', data: EMPTY_FC });
      map.addSource('aircraft', { type: 'geojson', data: EMPTY_FC });

      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#4cc4ff',
          'line-width': 2,
          'line-opacity': 0.75,
          'line-dasharray': [2, 2],
        },
      });

      map.addLayer({
        id: 'trail-line',
        type: 'line',
        source: 'trail',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#ff9d2e', 'line-width': 3, 'line-opacity': 0.9 },
      });

      map.addLayer({
        id: 'route-end-dots',
        type: 'circle',
        source: 'route-ends',
        paint: {
          'circle-radius': 5,
          'circle-color': '#0a0f1a',
          'circle-stroke-color': '#4cc4ff',
          'circle-stroke-width': 2,
        },
      });

      map.addLayer({
        id: 'route-end-labels',
        type: 'symbol',
        source: 'route-ends',
        layout: {
          'text-field': ['get', 'code'],
          'text-font': ['Noto Sans Bold'],
          'text-size': 12,
          'text-offset': [0, 1.3],
          'text-anchor': 'top',
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#e8eefc',
          'text-halo-color': '#0a0f1a',
          'text-halo-width': 1.6,
        },
      });

      map.addLayer({
        id: 'aircraft-halo',
        type: 'symbol',
        source: 'aircraft',
        filter: ['==', ['get', 'selected'], true],
        layout: {
          'icon-image': SELECTED_ICON,
          'icon-size': 0.75,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        },
      });

      map.addLayer({
        id: 'aircraft-icons',
        type: 'symbol',
        source: 'aircraft',
        layout: {
          'icon-image': ['get', 'icon'],
          'icon-rotate': ['get', 'trk'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            2, 0.28,
            5, 0.4,
            8, 0.55,
            11, 0.7,
          ],
        },
      });

      map.addLayer({
        id: 'aircraft-labels',
        type: 'symbol',
        source: 'aircraft',
        minzoom: 7.5,
        layout: {
          'text-field': ['get', 'cs'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 11,
          'text-offset': [0, 1.6],
          'text-anchor': 'top',
          'text-optional': true,
        },
        paint: {
          'text-color': '#c9d6f0',
          'text-halo-color': '#0a0f1a',
          'text-halo-width': 1.4,
        },
      });

      map.on('click', 'aircraft-icons', (e) => {
        const f = e.features?.[0];
        const id = f?.properties?.id as string | undefined;
        if (id) select(id);
      });

      map.on('mouseenter', 'aircraft-icons', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'aircraft-icons', () => {
        map.getCanvas().style.cursor = '';
      });

      setStyleReady(true);
      refreshRef.current();
    });

    const syncHash = () => {
      const c = map.getCenter();
      const hash = `#${c.lat.toFixed(3)}/${c.lng.toFixed(3)}/${map.getZoom().toFixed(1)}`;
      window.history.replaceState(null, '', hash);
    };

    let moveTimer: ReturnType<typeof setTimeout> | null = null;
    map.on('moveend', () => {
      syncHash();
      if (followingRef.current) return; // our own camera move, not the user's
      if (moveTimer) clearTimeout(moveTimer);
      moveTimer = setTimeout(() => refreshRef.current(), 400);
    });

    return () => {
      if (moveTimer) clearTimeout(moveTimer);
      map.remove();
      mapRef.current = null;
    };
  }, [select]);

  // -------------------------------------------------------------------------
  // Polling
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!styleReady) return;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      refreshRef.current();
      const zoom = mapRef.current?.getZoom() ?? 2;
      timer = setTimeout(tick, pollIntervalMs(zoom));
    };

    timer = setTimeout(tick, pollIntervalMs(mapRef.current?.getZoom() ?? 2));
    return () => clearTimeout(timer);
  }, [styleReady]);

  // -------------------------------------------------------------------------
  // Render loop: dead reckoning so aircraft glide between polls
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!styleReady) return;
    let raf = 0;
    let lastDraw = 0;

    const draw = (ts: number) => {
      raf = requestAnimationFrame(draw);
      if (ts - lastDraw < 100) return; // ~10 fps is plenty and keeps laptops cool
      lastDraw = ts;

      const map = mapRef.current;
      if (!map) return;
      const src = map.getSource('aircraft') as GeoJSONSource | undefined;
      if (!src) return;

      const now = Date.now();
      const selId = selectedIdRef.current;
      const features: GeoJSON.Feature[] = [];
      let selectedPos: [number, number] | null = null;

      tracksRef.current.forEach((a) => {
        const ageS = (now - a.t) / 1000;
        if (ageS * 1000 > MAX_AGE_MS) return;

        const travelled = a.ground ? 0 : (a.gs * Math.min(ageS, MAX_EXTRAPOLATE_S)) / 3600;
        const p =
          travelled > 0
            ? destinationPoint({ lat: a.lat, lon: a.lon }, a.trk, travelled)
            : { lat: a.lat, lon: a.lon };

        const band = altitudeBand(a.alt, a.ground);
        const isSelected = a.id === selId;
        if (isSelected) selectedPos = [p.lon, p.lat];

        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
          properties: {
            id: a.id,
            cs: a.cs,
            trk: a.trk,
            icon: iconId(silhouetteFor(a.type, a.cat), band),
            selected: isSelected,
          },
        });
      });

      src.setData({ type: 'FeatureCollection', features });

      // Breadcrumb trail for the selected aircraft.
      if (selectedPos) {
        const trail = trailRef.current;
        const last = trail[trail.length - 1];
        const pos = selectedPos as [number, number];
        if (!last || Math.abs(last[0] - pos[0]) > 0.002 || Math.abs(last[1] - pos[1]) > 0.002) {
          trail.push(pos);
          if (trail.length > 400) trail.shift();
        }
        const tSrc = map.getSource('trail') as GeoJSONSource | undefined;
        tSrc?.setData(
          trail.length > 1
            ? {
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: trail },
                properties: {},
              }
            : EMPTY_FC,
        );

        if (followingRef.current) {
          map.easeTo({ center: pos, duration: 900, easing: (x) => x });
        }
      } else {
        (map.getSource('trail') as GeoJSONSource | undefined)?.setData(EMPTY_FC);
      }
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [styleReady]);

  // -------------------------------------------------------------------------
  // Route line
  // -------------------------------------------------------------------------

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    const routeSrc = map.getSource('route') as GeoJSONSource | undefined;
    const endsSrc = map.getSource('route-ends') as GeoJSONSource | undefined;
    if (!routeSrc || !endsSrc) return;

    const leg = selected
      ? pickCurrentLeg(route?.airports, { lat: selected.lat, lon: selected.lon })
      : null;
    const from = leg?.from;
    const to = leg?.to;

    if (!from || !to) {
      routeSrc.setData(EMPTY_FC);
      endsSrc.setData(EMPTY_FC);
      return;
    }

    routeSrc.setData({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: greatCirclePath(from, to) },
      properties: {},
    });

    endsSrc.setData({
      type: 'FeatureCollection',
      features: [from, to].map((ap) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [ap.lon, ap.lat] },
        properties: { code: ap.iata || ap.icao },
      })),
    });
  }, [route, styleReady, selected]);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const goTo = useCallback((lat: number, lon: number, zoom = 7.5) => {
    mapRef.current?.flyTo({ center: [lon, lat], zoom, duration: 1600 });
  }, []);

  const toggleFollow = useCallback(() => {
    followingRef.current = !followingRef.current;
    setFollowing(followingRef.current);
  }, []);

  const runSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const q = query.trim();
      if (q.length < 3) return;
      setSearching(true);
      setSearchError(false);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const json = (await res.json()) as { results?: Aircraft[] };
        const hit = json.results?.[0];
        if (!hit) {
          setSearchError(true);
          return;
        }
        tracksRef.current.set(hit.id, { ...hit, t: Date.now() });
        select(hit.id);
        goTo(hit.lat, hit.lon, 7);
      } catch {
        setSearchError(true);
      } finally {
        setSearching(false);
      }
    },
    [query, select, goTo],
  );

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => goTo(pos.coords.latitude, pos.coords.longitude, 8),
      () => goTo(37.4691, 126.451, 8), // Incheon as a friendly fallback
      { timeout: 8000 },
    );
  }, [goTo]);

  const bands = ['ground', 'low', 'climb', 'mid', 'high', 'cruise'] as const;

  return (
    <div className="app">
      <SiteNav>
        <form className="search" onSubmit={runSearch} role="search">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchError(false);
            }}
            placeholder={t('search.placeholder')}
            aria-label={t('search.label')}
          />
          <button type="submit" disabled={searching || query.trim().length < 3}>
            {searching ? '…' : '→'}
          </button>
        </form>
      </SiteNav>

      <nav className="hubbar" aria-label={t('hubs.title')}>
        <span className="label">{t('hubs.title')}</span>
        <button className="hub" onClick={useMyLocation}>
          <span className="iata">◎</span>
          <span className="city">{t('map.myLocation')}</span>
        </button>
        {HUBS.map((h) => (
          <button key={h.icao} className="hub" onClick={() => goTo(h.lat, h.lon)}>
            <span className="iata">{h.iata}</span>
            <span className="city">{h.city}</span>
          </button>
        ))}
      </nav>

      <div className="map-wrap">
        <div className="map" ref={containerRef} />

        <div className="status">
          {firstLoad && <div className="pill">{t('map.loading')}</div>}
          {offline && <div className="pill warn">{t('map.offline')}</div>}
          {!firstLoad && !offline && <div className="pill">{t('map.counting', { count })}</div>}
          {worldMode && !firstLoad && <div className="pill">{t('map.worldMode')}</div>}
          {searchError && <div className="pill warn">{t('search.notFound')}</div>}
        </div>

        <div className="legend">
          <h2>{t('legend.title')}</h2>
          <ul>
            {bands.map((b) => (
              <li key={b}>
                <span className="swatch" style={{ background: ALT_BAND_COLOR[b] }} />
                {t(`legend.${b}`)}
              </li>
            ))}
          </ul>
        </div>

        {selected && (
          <AircraftPanel
            aircraft={selected}
            route={route}
            routeLoading={routeLoading}
            following={following}
            units={units}
            locale={locale}
            sightingCount={book.sightings[selected.id]?.count ?? 1}
            onClose={() => select(null)}
            onToggleFollow={toggleFollow}
          />
        )}

      </div>

      <footer className="footer">
        <span>{t('map.attribution')}</span>
        <span>{t('footer.dataNote')}</span>
        <span>{t('footer.notAffiliated')}</span>
      </footer>
    </div>
  );
}
