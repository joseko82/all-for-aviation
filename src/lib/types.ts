/** Slimmed aircraft record sent from /api/flights to the browser. */
export interface Aircraft {
  /** ICAO 24-bit address, lowercase hex. Stable unique id. */
  id: string;
  /** Callsign as broadcast, trimmed. e.g. "KAL017". May be empty. */
  cs: string;
  /** Registration / tail number. e.g. "HL7642". May be empty. */
  reg: string;
  /** ICAO type code. e.g. "B748". May be empty. */
  type: string;
  lat: number;
  lon: number;
  /** Barometric altitude in feet, or 0 when on the ground. */
  alt: number;
  /** True when the aircraft reports being on the ground. */
  ground: boolean;
  /** Ground speed in knots. */
  gs: number;
  /** Track over ground in degrees (0 = north). */
  trk: number;
  /** Vertical rate in feet per minute. Positive = climbing. */
  vr: number;
  /** ADS-B emitter category, e.g. "A3", "A5". */
  cat: string;
  /** Distance from the query centre in nautical miles, when available. */
  dst?: number;
}

export interface FlightsResponse {
  /** Server timestamp in ms since epoch. */
  now: number;
  /** Which upstream source answered: "adsb.lol" or "opensky". */
  source: string;
  aircraft: Aircraft[];
}

export interface RouteAirport {
  name: string;
  icao: string;
  iata: string;
  location: string;
  countryiso2: string;
  lat: number;
  lon: number;
}

export interface FlightRoute {
  callsign: string;
  airlineCode: string;
  number: string;
  airports: RouteAirport[];
}
