'use client';

import { useEffect, useRef } from 'react';
import maplibregl, { type Map as MapLibreMap, type GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { greatCirclePath, type LngLat } from '@/lib/geo';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';

interface Props {
  /** Where the player has clicked, if anywhere. */
  guess: LngLat | null;
  /** Revealed once the round is scored. */
  truth: LngLat | null;
  onGuess: (p: LngLat) => void;
  disabled: boolean;
}

/**
 * A plain world map the player clicks to place a guess.
 *
 * A light basemap on purpose: place names are the point of this round, and the
 * dark map used for aircraft hides them.
 */
export default function GuessMap({ guess, truth, onGuess, disabled }: Props) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const readyRef = useRef(false);
  const onGuessRef = useRef(onGuess);
  const disabledRef = useRef(disabled);

  onGuessRef.current = onGuess;
  disabledRef.current = disabled;

  useEffect(() => {
    if (!boxRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: boxRef.current,
      style: MAP_STYLE,
      center: [20, 20],
      zoom: 0.8,
      minZoom: 0.5,
      maxZoom: 8,
      attributionControl: false,
      dragRotate: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      map.addSource('marks', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addSource('link', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

      map.addLayer({
        id: 'link-line',
        type: 'line',
        source: 'link',
        paint: { 'line-color': '#e0533d', 'line-width': 2, 'line-dasharray': [2, 2] },
      });
      map.addLayer({
        id: 'mark-dots',
        type: 'circle',
        source: 'marks',
        paint: {
          'circle-radius': 7,
          'circle-color': ['case', ['==', ['get', 'kind'], 'truth'], '#1f9d55', '#2f6fed'],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });
      readyRef.current = true;
    });

    map.on('click', (e) => {
      if (disabledRef.current) return;
      onGuessRef.current({ lat: e.lngLat.lat, lon: e.lngLat.lng });
    });

    return () => {
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    const marks = map.getSource('marks') as GeoJSONSource | undefined;
    const link = map.getSource('link') as GeoJSONSource | undefined;
    if (!marks || !link) return;

    const features: GeoJSON.Feature[] = [];
    if (guess) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [guess.lon, guess.lat] },
        properties: { kind: 'guess' },
      });
    }
    if (truth) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [truth.lon, truth.lat] },
        properties: { kind: 'truth' },
      });
    }
    marks.setData({ type: 'FeatureCollection', features });

    if (guess && truth) {
      link.setData({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: greatCirclePath(guess, truth, 64) },
        properties: {},
      });
      map.fitBounds(
        [
          [Math.min(guess.lon, truth.lon), Math.min(guess.lat, truth.lat)],
          [Math.max(guess.lon, truth.lon), Math.max(guess.lat, truth.lat)],
        ],
        { padding: 70, duration: 900, maxZoom: 6 },
      );
    } else {
      link.setData({ type: 'FeatureCollection', features: [] });
    }
  }, [guess, truth]);

  return <div className="guess-map" ref={boxRef} />;
}
