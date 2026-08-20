import { NextRequest, NextResponse } from 'next/server';
import { WORLD_HUBS } from '@/lib/hubs';
import { Aircraft, FlightsResponse } from '@/lib/types';
import { fetchNearPoint, fetchOpenSkyBox, FetchOptions } from '@/lib/upstream';

/**
 * Live aircraft positions.
 *
 * The browser only ever talks to this route, never to the upstream API.
 * That gives us three things for free:
 *   1. no CORS problems,
 *   2. one shared edge cache instead of one request per visitor,
 *   3. a single place to swap data providers.
 *
 *   GET /api/flights?lat=37.46&lon=126.45&dist=120   → aircraft near a point
 *   GET /api/flights?mode=hubs                        → sample of world hubs
 *   Add &all=1 to include non-airliners. Military is always excluded.
 */

export const dynamic = 'force-dynamic';

/** Seconds the CDN may serve a cached response. Keeps upstream load flat. */
const POINT_CACHE = 10;
const HUBS_CACHE = 60;

function ok(payload: FlightsResponse, maxAge: number) {
  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 3}`,
    },
  });
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const opts: FetchOptions = { airlinersOnly: sp.get('all') !== '1' };

  if (sp.get('mode') === 'hubs') {
    const results = await Promise.allSettled(
      WORLD_HUBS.map((h) => fetchNearPoint(h.lat, h.lon, 250, opts)),
    );

    const seen = new Set<string>();
    const aircraft: Aircraft[] = [];
    for (const r of results) {
      if (r.status !== 'fulfilled') continue;
      for (const a of r.value) {
        if (seen.has(a.id)) continue;
        seen.add(a.id);
        aircraft.push(a);
      }
    }

    if (aircraft.length === 0 && results.every((r) => r.status === 'rejected')) {
      return NextResponse.json(
        { error: 'upstream_unavailable' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    return ok({ now: Date.now(), source: 'adsb.lol', aircraft }, HUBS_CACHE);
  }

  const rawLat = sp.get('lat');
  const rawLon = sp.get('lon');
  if (rawLat === null || rawLon === null) {
    return NextResponse.json({ error: 'missing_coordinates' }, { status: 400 });
  }

  const lat = Number(rawLat);
  const lon = Number(rawLon);
  const dist = Number(sp.get('dist') ?? '100');

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: 'bad_coordinates' }, { status: 400 });
  }

  try {
    const aircraft = await fetchNearPoint(lat, lon, dist, opts);
    return ok({ now: Date.now(), source: 'adsb.lol', aircraft }, POINT_CACHE);
  } catch {
    // Primary source failed — try OpenSky with a bounding box of roughly the
    // same coverage. Silently returns nothing useful if no credentials are set.
    try {
      const dLat = Math.min(20, dist / 60);
      const dLon = Math.min(20, dist / (60 * Math.max(0.2, Math.cos((lat * Math.PI) / 180))));
      const aircraft = await fetchOpenSkyBox(lat - dLat, lon - dLon, lat + dLat, lon + dLon, opts);
      return ok({ now: Date.now(), source: 'opensky', aircraft }, 30);
    } catch {
      return NextResponse.json(
        { error: 'upstream_unavailable' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }
  }
}
