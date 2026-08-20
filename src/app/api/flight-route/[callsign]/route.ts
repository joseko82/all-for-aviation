import { NextResponse } from 'next/server';
import { FlightRoute, RouteAirport } from '@/lib/types';

/**
 * Origin and destination for a broadcast callsign.
 *
 * adsb.lol publishes a static route database derived from the open
 * "VRS standing data" set. Files are addressed by the first two characters of
 * the callsign, e.g. KAL017 → /routes/KA/KAL017.json.
 *
 * These are *scheduled* routes matched by flight number, not observed ones, so
 * treat a hit as "very likely" rather than certain. A miss is normal and must
 * degrade quietly — plenty of flights (charters, positioning, freight) are not
 * in the database.
 */

const ROUTE_BASE = 'https://vrs-standing-data.adsb.lol/routes';
const UA = 'all-for-aviation/0.1 (hobby project; contact via GitHub)';

interface RawRoute {
  callsign?: string;
  number?: string;
  airline_code?: string;
  airport_codes?: string;
  _airports?: RouteAirport[];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ callsign: string }> },
) {
  const { callsign } = await params;
  const cs = callsign.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (cs.length < 3) {
    return NextResponse.json({ error: 'bad_callsign' }, { status: 400 });
  }

  const url = `${ROUTE_BASE}/${cs.slice(0, 2)}/${cs}.json`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      // Schedules change on the order of weeks, so cache hard.
      next: { revalidate: 86_400 },
    });

    if (res.status === 404) {
      return NextResponse.json(
        { found: false },
        { headers: { 'Cache-Control': 'public, s-maxage=3600' } },
      );
    }
    if (!res.ok) throw new Error(`route db responded ${res.status}`);

    const raw = (await res.json()) as RawRoute;
    const airports = (raw._airports ?? []).filter(
      (a) => Number.isFinite(a.lat) && Number.isFinite(a.lon),
    );

    if (airports.length < 2) {
      return NextResponse.json(
        { found: false },
        { headers: { 'Cache-Control': 'public, s-maxage=3600' } },
      );
    }

    const route: FlightRoute = {
      callsign: raw.callsign ?? cs,
      airlineCode: raw.airline_code ?? cs.slice(0, 3),
      number: raw.number ?? '',
      airports,
    };

    return NextResponse.json(
      { found: true, route },
      { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } },
    );
  } catch {
    return NextResponse.json(
      { found: false },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
