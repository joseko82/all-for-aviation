import type { RouteAirport } from './types';
import { distanceNm, type LngLat } from './geo';

export interface RouteLeg {
  from: RouteAirport;
  to: RouteAirport;
  /** 0-based index of this leg within the full route. */
  index: number;
  /** Total number of legs in the route. */
  total: number;
}

/**
 * Choose which leg of a multi-stop route the aircraft is currently flying.
 *
 * Some scheduled routes have intermediate stops — ETH672 is Addis Ababa →
 * Incheon → Tokyo. Showing "ADD → NRT" to someone watching that aircraft climb
 * out of Incheon is simply wrong, so we pick the leg whose endpoints the
 * aircraft actually lies between.
 *
 * The test is a detour cost: for each leg A→B, how much longer is
 * A→aircraft→B than A→B directly? The real leg has the smallest detour.
 */
export function pickCurrentLeg(
  airports: RouteAirport[] | undefined,
  pos: LngLat,
): RouteLeg | null {
  if (!airports || airports.length < 2) return null;

  const total = airports.length - 1;
  if (total === 1) {
    return { from: airports[0], to: airports[1], index: 0, total };
  }

  let bestIndex = 0;
  let bestDetour = Number.POSITIVE_INFINITY;

  for (let i = 0; i < total; i++) {
    const a = airports[i];
    const b = airports[i + 1];
    const detour = distanceNm(a, pos) + distanceNm(pos, b) - distanceNm(a, b);
    if (detour < bestDetour) {
      bestDetour = detour;
      bestIndex = i;
    }
  }

  return {
    from: airports[bestIndex],
    to: airports[bestIndex + 1],
    index: bestIndex,
    total,
  };
}
