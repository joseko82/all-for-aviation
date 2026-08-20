/**
 * The hub shortcuts shown above the map, and the sample points used to
 * populate the zoomed-out world view.
 *
 * Coordinates are from OurAirports (public domain).
 * `name` is intentionally not translated here — airport names are proper nouns.
 * The descriptive label lives in messages/<locale>.json under `hubs.<icao>`.
 */
export interface Hub {
  icao: string;
  iata: string;
  city: string;
  lat: number;
  lon: number;
  /** Included in the zoomed-out world sweep. */
  world: boolean;
}

export const HUBS: Hub[] = [
  { icao: 'RKSI', iata: 'ICN', city: 'Seoul',        lat: 37.4691, lon: 126.4510, world: true },
  { icao: 'RKSS', iata: 'GMP', city: 'Seoul Gimpo',  lat: 37.5583, lon: 126.7906, world: false },
  { icao: 'RKPC', iata: 'CJU', city: 'Jeju',         lat: 33.5113, lon: 126.4930, world: false },
  { icao: 'RJTT', iata: 'HND', city: 'Tokyo',        lat: 35.5523, lon: 139.7798, world: true },
  { icao: 'ZBAA', iata: 'PEK', city: 'Beijing',      lat: 40.0801, lon: 116.5846, world: true },
  { icao: 'VHHH', iata: 'HKG', city: 'Hong Kong',    lat: 22.3089, lon: 113.9145, world: true },
  { icao: 'WSSS', iata: 'SIN', city: 'Singapore',    lat:  1.3502, lon: 103.9944, world: true },
  { icao: 'OMDB', iata: 'DXB', city: 'Dubai',        lat: 25.2528, lon: 55.3644,  world: true },
  { icao: 'EGLL', iata: 'LHR', city: 'London',       lat: 51.4706, lon: -0.4619,  world: true },
  { icao: 'EHAM', iata: 'AMS', city: 'Amsterdam',    lat: 52.3086, lon:  4.7639,  world: true },
  { icao: 'KJFK', iata: 'JFK', city: 'New York',     lat: 40.6398, lon: -73.7789, world: true },
  { icao: 'KLAX', iata: 'LAX', city: 'Los Angeles',  lat: 33.9425, lon: -118.4081, world: true },
  { icao: 'KATL', iata: 'ATL', city: 'Atlanta',      lat: 33.6367, lon: -84.4281, world: true },
  { icao: 'YSSY', iata: 'SYD', city: 'Sydney',       lat: -33.9461, lon: 151.1772, world: true },
];

export const WORLD_HUBS = HUBS.filter((h) => h.world);

export function hubByIata(iata: string): Hub | undefined {
  return HUBS.find((h) => h.iata === iata.toUpperCase());
}
