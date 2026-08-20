import { Aircraft } from './types';
import { DB_FLAG_MILITARY, isAirliner } from './aircraft';

/**
 * Upstream data access.
 *
 * Primary source: adsb.lol — community-run open-data ADS-B network, no API key.
 * Fallback:       OpenSky Network — used only when adsb.lol fails and
 *                 OPENSKY_CLIENT_ID / OPENSKY_CLIENT_SECRET are configured.
 *
 * Everything upstream-specific is confined to this file. Swapping providers
 * later means editing here and nothing else.
 */

const ADSB_LOL_BASE = 'https://api.adsb.lol';
const OPENSKY_TOKEN_URL =
  process.env.OPENSKY_TOKEN_URL ??
  'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token';
const OPENSKY_API_BASE = 'https://opensky-network.org/api';

const UA = 'all-for-aviation/0.1 (hobby project; contact via GitHub)';

/** Raw record as returned by the ADSBx v2-compatible feed. */
interface RawAircraft {
  hex?: string;
  flight?: string;
  r?: string;
  t?: string;
  lat?: number;
  lon?: number;
  alt_baro?: number | 'ground';
  alt_geom?: number;
  gs?: number;
  track?: number;
  true_heading?: number;
  mag_heading?: number;
  baro_rate?: number;
  geom_rate?: number;
  category?: string;
  dbFlags?: number;
  dst?: number;
}

export interface FetchOptions {
  /** Drop anything that is not a passenger/cargo airliner. */
  airlinersOnly: boolean;
}

function normalise(raw: RawAircraft, opts: FetchOptions): Aircraft | null {
  if (raw.lat === undefined || raw.lon === undefined || !raw.hex) return null;

  // Military aircraft are excluded unconditionally — this is a site about
  // airliners, and the exclusion is a product decision, not a toggle.
  if (((raw.dbFlags ?? 0) & DB_FLAG_MILITARY) !== 0) return null;

  if (opts.airlinersOnly && !isAirliner(raw.t, raw.category)) return null;

  const onGround = raw.alt_baro === 'ground';
  const alt = onGround ? 0 : typeof raw.alt_baro === 'number' ? raw.alt_baro : raw.alt_geom ?? 0;

  return {
    id: raw.hex,
    cs: (raw.flight ?? '').trim(),
    reg: (raw.r ?? '').trim(),
    type: (raw.t ?? '').trim(),
    lat: raw.lat,
    lon: raw.lon,
    alt,
    ground: onGround,
    gs: raw.gs ?? 0,
    trk: raw.track ?? raw.true_heading ?? raw.mag_heading ?? 0,
    vr: raw.baro_rate ?? raw.geom_rate ?? 0,
    cat: raw.category ?? '',
    dst: raw.dst,
  };
}

/**
 * Aircraft within `distNm` nautical miles of a point.
 * The upstream endpoint caps the radius at 250 nm.
 */
export async function fetchNearPoint(
  lat: number,
  lon: number,
  distNm: number,
  opts: FetchOptions,
  revalidateSeconds = 10,
): Promise<Aircraft[]> {
  const r = Math.max(1, Math.min(250, Math.round(distNm)));
  const url = `${ADSB_LOL_BASE}/v2/point/${lat.toFixed(4)}/${lon.toFixed(4)}/${r}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    next: { revalidate: revalidateSeconds },
  });
  if (!res.ok) throw new Error(`adsb.lol responded ${res.status}`);

  const data = (await res.json()) as { ac?: RawAircraft[] };
  return (data.ac ?? [])
    .map((a) => normalise(a, opts))
    .filter((a): a is Aircraft => a !== null);
}

/** Look up a single aircraft by its broadcast callsign (ICAO form, e.g. KAL017). */
export async function fetchByCallsign(callsign: string, opts: FetchOptions): Promise<Aircraft[]> {
  const cs = callsign.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!cs) return [];
  const res = await fetch(`${ADSB_LOL_BASE}/v2/callsign/${cs}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    next: { revalidate: 10 },
  });
  if (!res.ok) throw new Error(`adsb.lol responded ${res.status}`);
  const data = (await res.json()) as { ac?: RawAircraft[] };
  return (data.ac ?? [])
    .map((a) => normalise(a, opts))
    .filter((a): a is Aircraft => a !== null);
}

/** Look up a single aircraft by registration (tail number, e.g. HL7642). */
export async function fetchByRegistration(reg: string, opts: FetchOptions): Promise<Aircraft[]> {
  const r = reg.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (!r) return [];
  const res = await fetch(`${ADSB_LOL_BASE}/v2/reg/${r}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    next: { revalidate: 10 },
  });
  if (!res.ok) throw new Error(`adsb.lol responded ${res.status}`);
  const data = (await res.json()) as { ac?: RawAircraft[] };
  return (data.ac ?? [])
    .map((a) => normalise(a, opts))
    .filter((a): a is Aircraft => a !== null);
}

// ---------------------------------------------------------------------------
// OpenSky fallback
// ---------------------------------------------------------------------------

let cachedToken: { value: string; expiresAt: number } | null = null;

async function openSkyToken(): Promise<string | null> {
  const id = process.env.OPENSKY_CLIENT_ID;
  const secret = process.env.OPENSKY_CLIENT_SECRET;
  if (!id || !secret) return null;

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: id,
    client_secret: secret,
  });

  const res = await fetch(OPENSKY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });
  if (!res.ok) return null;

  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) return null;

  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 1800) * 1000,
  };
  return cachedToken.value;
}

/** OpenSky state vector tuple, by index. See the OpenSky REST API docs. */
type OpenSkyState = [
  string,        // 0  icao24
  string | null, // 1  callsign
  string,        // 2  origin_country
  number | null, // 3  time_position
  number,        // 4  last_contact
  number | null, // 5  longitude
  number | null, // 6  latitude
  number | null, // 7  baro_altitude (m)
  boolean,       // 8  on_ground
  number | null, // 9  velocity (m/s)
  number | null, // 10 true_track
  number | null, // 11 vertical_rate (m/s)
  number[] | null, // 12 sensors
  number | null, // 13 geo_altitude (m)
  string | null, // 14 squawk
  boolean,       // 15 spi
  number,        // 16 position_source
  number?,       // 17 category
];

const M_TO_FT = 3.28084;
const MS_TO_KT = 1.94384;

export async function fetchOpenSkyBox(
  lamin: number,
  lomin: number,
  lamax: number,
  lomax: number,
  opts: FetchOptions,
): Promise<Aircraft[]> {
  const token = await openSkyToken();
  const url =
    `${OPENSKY_API_BASE}/states/all` +
    `?lamin=${lamin.toFixed(4)}&lomin=${lomin.toFixed(4)}` +
    `&lamax=${lamax.toFixed(4)}&lomax=${lomax.toFixed(4)}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`OpenSky responded ${res.status}`);

  const data = (await res.json()) as { states?: OpenSkyState[] };
  const out: Aircraft[] = [];

  for (const s of data.states ?? []) {
    const lon = s[5];
    const lat = s[6];
    if (lon === null || lat === null) continue;

    // OpenSky gives no ICAO type code, so the airliner filter can only use the
    // emitter category (index 17), which is often absent. We keep the record
    // when we cannot tell — a fallback that shows too much beats a blank map.
    const category = s[17] !== undefined ? `A${s[17]}` : '';
    if (opts.airlinersOnly && category && !isAirliner(undefined, category)) continue;

    out.push({
      id: s[0],
      cs: (s[1] ?? '').trim(),
      reg: '',
      type: '',
      lat,
      lon,
      alt: Math.round((s[7] ?? s[13] ?? 0) * M_TO_FT),
      ground: s[8],
      gs: Math.round((s[9] ?? 0) * MS_TO_KT),
      trk: s[10] ?? 0,
      vr: Math.round((s[11] ?? 0) * M_TO_FT * 60),
      cat: category,
    });
  }
  return out;
}
