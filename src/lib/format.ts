/**
 * Unit conversion and locale-aware formatting.
 *
 * Rule for this codebase: raw ADS-B units (feet, knots, nautical miles) travel
 * through the app untouched. Conversion happens here, at render time only.
 * That keeps the data layer stable when we add a metric locale.
 */

export type UnitSystem = 'imperial' | 'metric';

const FT_TO_M = 0.3048;
const KT_TO_KMH = 1.852;
const NM_TO_KM = 1.852;

function num(locale: string, value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value);
}

export function formatAltitude(ft: number, units: UnitSystem, locale: string): string {
  return units === 'metric'
    ? `${num(locale, Math.round(ft * FT_TO_M))} m`
    : `${num(locale, Math.round(ft))} ft`;
}

export function formatSpeed(kt: number, units: UnitSystem, locale: string): string {
  return units === 'metric'
    ? `${num(locale, Math.round(kt * KT_TO_KMH))} km/h`
    : `${num(locale, Math.round(kt))} kt`;
}

export function formatDistance(nm: number, units: UnitSystem, locale: string): string {
  return units === 'metric'
    ? `${num(locale, Math.round(nm * NM_TO_KM))} km`
    : `${num(locale, Math.round(nm))} nm`;
}

export function formatVerticalRate(fpm: number, units: UnitSystem, locale: string): string {
  const sign = fpm > 0 ? '+' : '';
  return units === 'metric'
    ? `${sign}${num(locale, Math.round(fpm * FT_TO_M))} m/min`
    : `${sign}${num(locale, Math.round(fpm))} ft/min`;
}

/** Compass point for a track in degrees, e.g. 268 → "W". */
export function compassPoint(deg: number): string {
  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return points[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

/**
 * Altitude band used for icon and trail colour. Deliberately coarse: the point
 * is that a 12-year-old learns "orange means it just took off" without reading
 * a single number.
 */
export type AltBand = 'ground' | 'low' | 'climb' | 'mid' | 'high' | 'cruise';

export function altitudeBand(altFt: number, onGround: boolean): AltBand {
  if (onGround) return 'ground';
  if (altFt < 3000) return 'low';
  if (altFt < 10000) return 'climb';
  if (altFt < 20000) return 'mid';
  if (altFt < 30000) return 'high';
  return 'cruise';
}

export const ALT_BAND_COLOR: Record<AltBand, string> = {
  ground: '#9aa5b1',
  low: '#ff5c39',
  climb: '#ff9d2e',
  mid: '#ffd23f',
  high: '#5ad2a0',
  cruise: '#4cc4ff',
};
