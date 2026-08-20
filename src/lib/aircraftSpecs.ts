/**
 * Published dimensions for the airliners a spotter actually sees.
 *
 * Figures are manufacturer specifications rounded to one decimal. They are
 * approximate by nature: wingspan changes with winglet fit, seat counts depend
 * entirely on the airline's cabin layout, and range depends on load. The site
 * says "typical", not "exact", for that reason.
 */

export interface AircraftSpec {
  /** ICAO type code, matching what the ADS-B feed reports. */
  code: string;
  name: string;
  maker: 'Airbus' | 'Boeing' | 'Embraer' | 'ATR' | 'Bombardier';
  lengthM: number;
  wingspanM: number;
  heightM: number;
  /** Typical two-class seat count. */
  seats: number;
  /** Maximum seats in an all-economy layout. */
  maxSeats: number;
  rangeKm: number;
  engines: 2 | 4;
  /** Widebody = two aisles. */
  wide: boolean;
  firstFlight: number;
  /** One thing a 12-year-old will repeat at dinner. */
  factKey: string;
}

export const SPECS: AircraftSpec[] = [
  {
    code: 'AT76', name: 'ATR 72-600', maker: 'ATR',
    lengthM: 27.2, wingspanM: 27.1, heightM: 7.7,
    seats: 70, maxSeats: 78, rangeKm: 1528, engines: 2, wide: false,
    firstFlight: 1988, factKey: 'AT76',
  },
  {
    code: 'E190', name: 'Embraer E190', maker: 'Embraer',
    lengthM: 36.2, wingspanM: 28.7, heightM: 10.6,
    seats: 100, maxSeats: 114, rangeKm: 4537, engines: 2, wide: false,
    firstFlight: 2004, factKey: 'E190',
  },
  {
    code: 'A223', name: 'Airbus A220-300', maker: 'Airbus',
    lengthM: 38.7, wingspanM: 35.1, heightM: 11.5,
    seats: 130, maxSeats: 160, rangeKm: 6300, engines: 2, wide: false,
    firstFlight: 2015, factKey: 'A223',
  },
  {
    code: 'A20N', name: 'Airbus A320neo', maker: 'Airbus',
    lengthM: 37.6, wingspanM: 35.8, heightM: 11.8,
    seats: 165, maxSeats: 194, rangeKm: 6300, engines: 2, wide: false,
    firstFlight: 2014, factKey: 'A20N',
  },
  {
    code: 'B738', name: 'Boeing 737-800', maker: 'Boeing',
    lengthM: 39.5, wingspanM: 35.8, heightM: 12.5,
    seats: 162, maxSeats: 189, rangeKm: 5436, engines: 2, wide: false,
    firstFlight: 1997, factKey: 'B738',
  },
  {
    code: 'A21N', name: 'Airbus A321neo', maker: 'Airbus',
    lengthM: 44.5, wingspanM: 35.8, heightM: 11.8,
    seats: 200, maxSeats: 244, rangeKm: 7400, engines: 2, wide: false,
    firstFlight: 2016, factKey: 'A21N',
  },
  {
    code: 'B752', name: 'Boeing 757-200', maker: 'Boeing',
    lengthM: 47.3, wingspanM: 38.0, heightM: 13.6,
    seats: 200, maxSeats: 239, rangeKm: 7250, engines: 2, wide: false,
    firstFlight: 1982, factKey: 'B752',
  },
  {
    code: 'B763', name: 'Boeing 767-300ER', maker: 'Boeing',
    lengthM: 54.9, wingspanM: 47.6, heightM: 15.8,
    seats: 218, maxSeats: 290, rangeKm: 11070, engines: 2, wide: true,
    firstFlight: 1986, factKey: 'B763',
  },
  {
    code: 'B789', name: 'Boeing 787-9', maker: 'Boeing',
    lengthM: 62.8, wingspanM: 60.1, heightM: 17.0,
    seats: 290, maxSeats: 406, rangeKm: 14140, engines: 2, wide: true,
    firstFlight: 2013, factKey: 'B789',
  },
  {
    code: 'A339', name: 'Airbus A330-900neo', maker: 'Airbus',
    lengthM: 63.7, wingspanM: 64.0, heightM: 16.8,
    seats: 287, maxSeats: 460, rangeKm: 13334, engines: 2, wide: true,
    firstFlight: 2017, factKey: 'A339',
  },
  {
    code: 'A35K', name: 'Airbus A350-1000', maker: 'Airbus',
    lengthM: 73.8, wingspanM: 64.8, heightM: 17.1,
    seats: 350, maxSeats: 410, rangeKm: 16100, engines: 2, wide: true,
    firstFlight: 2016, factKey: 'A35K',
  },
  {
    code: 'B77W', name: 'Boeing 777-300ER', maker: 'Boeing',
    lengthM: 73.9, wingspanM: 64.8, heightM: 18.5,
    seats: 396, maxSeats: 550, rangeKm: 13650, engines: 2, wide: true,
    firstFlight: 2003, factKey: 'B77W',
  },
  {
    code: 'B748', name: 'Boeing 747-8', maker: 'Boeing',
    lengthM: 76.3, wingspanM: 68.4, heightM: 19.4,
    seats: 410, maxSeats: 605, rangeKm: 14320, engines: 4, wide: true,
    firstFlight: 2011, factKey: 'B748',
  },
  {
    code: 'A388', name: 'Airbus A380-800', maker: 'Airbus',
    lengthM: 72.7, wingspanM: 79.8, heightM: 24.1,
    seats: 525, maxSeats: 853, rangeKm: 15200, engines: 4, wide: true,
    firstFlight: 2005, factKey: 'A388',
  },
];

export const SPEC_BY_CODE: Record<string, AircraftSpec> = Object.fromEntries(
  SPECS.map((s) => [s.code, s]),
);

/** Everyday objects used to make metres mean something. */
export interface Yardstick {
  id: string;
  lengthM: number;
}

export const YARDSTICKS: Yardstick[] = [
  { id: 'person', lengthM: 1.7 },
  { id: 'bus', lengthM: 11 },
  { id: 'tennis', lengthM: 23.8 },
  { id: 'whale', lengthM: 25 },
  { id: 'pitch', lengthM: 105 },
];

export function specFor(typeCode: string | undefined): AircraftSpec | null {
  if (!typeCode) return null;
  return SPEC_BY_CODE[typeCode.toUpperCase()] ?? null;
}

/**
 * Approximate fuselage width in metres, used only for drawing the plan-view
 * silhouettes. Manufacturers publish cabin width and maximum external width
 * inconsistently, so these are rounded external figures — good enough to show
 * "one aisle versus two" at a glance, not a technical drawing.
 */
export function fuselageWidthM(spec: AircraftSpec): number {
  switch (spec.code) {
    case 'A388': return 7.1;
    case 'B748': return 6.5;
    case 'AT76': return 2.9;
    case 'E190': return 3.0;
    case 'A223': return 3.7;
    default: return spec.wide ? 5.9 : 4.0;
  }
}
