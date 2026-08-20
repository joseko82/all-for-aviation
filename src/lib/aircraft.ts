/**
 * Aircraft classification: what counts as an airliner, what shape to draw it,
 * and how to say its name in plain English.
 *
 * Data source note: the ADS-B feed gives us an ICAO type code (`t`) and an
 * ADS-B emitter category (`category`). Neither is guaranteed present, so every
 * lookup here degrades gracefully.
 */

/** ADS-B emitter categories that mean "big aeroplane". */
const AIRLINER_CATEGORIES = new Set([
  'A3', // Large (34,000 – 136,000 kg)
  'A4', // High-vortex large (B757 and similar)
  'A5', // Heavy (> 136,000 kg)
]);

/**
 * ICAO type codes for passenger and cargo jets/turboprops in scheduled service.
 * Used as a second chance for aircraft whose emitter category is missing or
 * under-reported (common on older transponders).
 */
const AIRLINER_TYPES = new Set([
  // Airbus narrowbody
  'A19N', 'A20N', 'A21N', 'A318', 'A319', 'A320', 'A321',
  // Airbus widebody
  'A306', 'A30B', 'A310', 'A332', 'A333', 'A337', 'A338', 'A339',
  'A342', 'A343', 'A345', 'A346', 'A359', 'A35K', 'A388',
  // Airbus / Bombardier regional
  'A221', 'A223', 'BCS1', 'BCS3',
  // Boeing narrowbody
  'B712', 'B733', 'B734', 'B735', 'B736', 'B737', 'B738', 'B739',
  'B38M', 'B39M', 'B3XM', 'B37M',
  // Boeing widebody
  'B741', 'B742', 'B743', 'B744', 'B748', 'B74F', 'B752', 'B753',
  'B762', 'B763', 'B764', 'B772', 'B773', 'B77L', 'B77W', 'B778', 'B779',
  'B788', 'B789', 'B78X',
  // Embraer
  'E170', 'E75L', 'E75S', 'E175', 'E190', 'E195', 'E290', 'E295', 'E135', 'E145',
  // Bombardier regional jets
  'CRJ2', 'CRJ7', 'CRJ9', 'CRJX',
  // Turboprops in scheduled service
  'AT43', 'AT45', 'AT46', 'AT72', 'AT75', 'AT76', 'DH8A', 'DH8B', 'DH8C', 'DH8D',
  // Other
  'MD11', 'MD82', 'MD83', 'MD88', 'MD90', 'B462', 'B463', 'SU95', 'RJ85', 'RJ1H',
]);

export type Silhouette = 'widebody' | 'narrowbody' | 'regional' | 'prop';

const WIDEBODY = new Set([
  'A306', 'A30B', 'A310', 'A332', 'A333', 'A337', 'A338', 'A339',
  'A342', 'A343', 'A345', 'A346', 'A359', 'A35K', 'A388',
  'B741', 'B742', 'B743', 'B744', 'B748', 'B74F', 'B762', 'B763', 'B764',
  'B772', 'B773', 'B77L', 'B77W', 'B778', 'B779', 'B788', 'B789', 'B78X',
  'MD11',
]);

const PROP = new Set([
  'AT43', 'AT45', 'AT46', 'AT72', 'AT75', 'AT76',
  'DH8A', 'DH8B', 'DH8C', 'DH8D',
]);

const REGIONAL = new Set([
  'E170', 'E75L', 'E75S', 'E175', 'E190', 'E195', 'E290', 'E295', 'E135', 'E145',
  'CRJ2', 'CRJ7', 'CRJ9', 'CRJX', 'A221', 'A223', 'BCS1', 'BCS3',
  'B462', 'B463', 'SU95', 'RJ85', 'RJ1H',
]);

/** Human-readable model names for the aircraft detail card. */
export const TYPE_NAMES: Record<string, string> = {
  A19N: 'Airbus A319neo', A20N: 'Airbus A320neo', A21N: 'Airbus A321neo',
  A318: 'Airbus A318', A319: 'Airbus A319', A320: 'Airbus A320', A321: 'Airbus A321',
  A221: 'Airbus A220-100', A223: 'Airbus A220-300',
  BCS1: 'Airbus A220-100', BCS3: 'Airbus A220-300',
  A306: 'Airbus A300-600', A30B: 'Airbus A300', A310: 'Airbus A310',
  A332: 'Airbus A330-200', A333: 'Airbus A330-300',
  A338: 'Airbus A330-800neo', A339: 'Airbus A330-900neo',
  A342: 'Airbus A340-200', A343: 'Airbus A340-300',
  A345: 'Airbus A340-500', A346: 'Airbus A340-600',
  A359: 'Airbus A350-900', A35K: 'Airbus A350-1000', A388: 'Airbus A380-800',
  B712: 'Boeing 717-200',
  B733: 'Boeing 737-300', B734: 'Boeing 737-400', B735: 'Boeing 737-500',
  B736: 'Boeing 737-600', B737: 'Boeing 737-700', B738: 'Boeing 737-800',
  B739: 'Boeing 737-900',
  B37M: 'Boeing 737 MAX 7', B38M: 'Boeing 737 MAX 8',
  B39M: 'Boeing 737 MAX 9', B3XM: 'Boeing 737 MAX 10',
  B741: 'Boeing 747-100', B742: 'Boeing 747-200', B743: 'Boeing 747-300',
  B744: 'Boeing 747-400', B748: 'Boeing 747-8', B74F: 'Boeing 747 Freighter',
  B752: 'Boeing 757-200', B753: 'Boeing 757-300',
  B762: 'Boeing 767-200', B763: 'Boeing 767-300', B764: 'Boeing 767-400',
  B772: 'Boeing 777-200', B773: 'Boeing 777-300',
  B77L: 'Boeing 777-200LR / F', B77W: 'Boeing 777-300ER',
  B778: 'Boeing 777-8', B779: 'Boeing 777-9',
  B788: 'Boeing 787-8', B789: 'Boeing 787-9', B78X: 'Boeing 787-10',
  E170: 'Embraer E170', E175: 'Embraer E175', E75L: 'Embraer E175',
  E75S: 'Embraer E175', E190: 'Embraer E190', E195: 'Embraer E195',
  E290: 'Embraer E190-E2', E295: 'Embraer E195-E2',
  E135: 'Embraer ERJ-135', E145: 'Embraer ERJ-145',
  CRJ2: 'Bombardier CRJ200', CRJ7: 'Bombardier CRJ700',
  CRJ9: 'Bombardier CRJ900', CRJX: 'Bombardier CRJ1000',
  AT43: 'ATR 42-300', AT45: 'ATR 42-500', AT46: 'ATR 42-600',
  AT72: 'ATR 72', AT75: 'ATR 72-500', AT76: 'ATR 72-600',
  DH8A: 'Dash 8-100', DH8B: 'Dash 8-200', DH8C: 'Dash 8-300',
  DH8D: 'Dash 8 Q400',
  MD11: 'McDonnell Douglas MD-11', MD82: 'MD-82', MD83: 'MD-83',
  MD88: 'MD-88', MD90: 'MD-90',
  B462: 'BAe 146-200', B463: 'BAe 146-300',
  RJ85: 'Avro RJ85', RJ1H: 'Avro RJ100', SU95: 'Sukhoi Superjet 100',
};

/** Bit 0 of the ADS-B `dbFlags` field marks a military aircraft. */
export const DB_FLAG_MILITARY = 1;
/** Bit 1 marks an aircraft the community has tagged as "interesting". */
export const DB_FLAG_INTERESTING = 2;

export function isAirliner(type: string | undefined, category: string | undefined): boolean {
  if (type && AIRLINER_TYPES.has(type.toUpperCase())) return true;
  if (category && AIRLINER_CATEGORIES.has(category.toUpperCase())) return true;
  return false;
}

export function silhouetteFor(type: string | undefined, category: string | undefined): Silhouette {
  const t = (type ?? '').toUpperCase();
  if (PROP.has(t)) return 'prop';
  if (WIDEBODY.has(t)) return 'widebody';
  if (REGIONAL.has(t)) return 'regional';
  if (category === 'A5') return 'widebody';
  if (category === 'A3' || category === 'A4') return 'narrowbody';
  return 'narrowbody';
}

export function typeName(type: string | undefined): string | null {
  if (!type) return null;
  return TYPE_NAMES[type.toUpperCase()] ?? null;
}
