/** Geodesic helpers. Everything here is pure maths — no dependencies. */

const R_EARTH_NM = 3440.065; // Earth radius in nautical miles
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

export interface LngLat {
  lon: number;
  lat: number;
}

/** Great-circle distance in nautical miles. */
export function distanceNm(a: LngLat, b: LngLat): number {
  const dLat = (b.lat - a.lat) * D2R;
  const dLon = (b.lon - a.lon) * D2R;
  const lat1 = a.lat * D2R;
  const lat2 = b.lat * D2R;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R_EARTH_NM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Spherical linear interpolation between two points on the globe.
 * `f` runs 0 (at `a`) to 1 (at `b`).
 */
export function interpolateGreatCircle(a: LngLat, b: LngLat, f: number): LngLat {
  const lat1 = a.lat * D2R;
  const lon1 = a.lon * D2R;
  const lat2 = b.lat * D2R;
  const lon2 = b.lon * D2R;

  const d =
    2 *
    Math.asin(
      Math.min(
        1,
        Math.sqrt(
          Math.sin((lat2 - lat1) / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2,
        ),
      ),
    );

  // Antipodal or identical points: nothing sensible to interpolate.
  if (d === 0) return { lon: a.lon, lat: a.lat };

  const A = Math.sin((1 - f) * d) / Math.sin(d);
  const B = Math.sin(f * d) / Math.sin(d);

  const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
  const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
  const z = A * Math.sin(lat1) + B * Math.sin(lat2);

  return {
    lat: Math.atan2(z, Math.sqrt(x * x + y * y)) * R2D,
    lon: Math.atan2(y, x) * R2D,
  };
}

/**
 * Build a great-circle path as a GeoJSON LineString coordinate array.
 * Longitudes are unwrapped so the line does not smear across the antimeridian
 * — this is what makes Seoul → Los Angeles draw over the Pacific rather than
 * straight back across Asia.
 */
export function greatCirclePath(a: LngLat, b: LngLat, steps = 128): [number, number][] {
  const pts: [number, number][] = [];
  let prevLon: number | null = null;
  let offset = 0;

  for (let i = 0; i <= steps; i++) {
    const p = interpolateGreatCircle(a, b, i / steps);
    let lon = p.lon + offset;
    if (prevLon !== null) {
      if (lon - prevLon > 180) {
        offset -= 360;
        lon -= 360;
      } else if (lon - prevLon < -180) {
        offset += 360;
        lon += 360;
      }
    }
    pts.push([lon, p.lat]);
    prevLon = lon;
  }
  return pts;
}

/**
 * How far along a route the aircraft is, as 0..1.
 * Uses distance flown / total distance, clamped — good enough for a progress
 * bar and far cheaper than projecting onto the great circle.
 */
export function routeProgress(from: LngLat, to: LngLat, now: LngLat): number {
  const total = distanceNm(from, to);
  if (total < 1) return 0;
  const flown = distanceNm(from, now);
  const remaining = distanceNm(now, to);
  // Guard against a position far off the direct line inflating both legs.
  const scale = flown + remaining;
  if (scale < 1) return 0;
  return Math.max(0, Math.min(1, flown / scale));
}

/**
 * Radius in nautical miles that covers the current map viewport.
 * The upstream API caps radius at 250 nm, so we clamp.
 */
export function viewportRadiusNm(
  centre: LngLat,
  northEast: LngLat,
  min = 20,
  max = 250,
): number {
  const r = distanceNm(centre, northEast);
  return Math.max(min, Math.min(max, Math.ceil(r)));
}

/**
 * Point reached by travelling `distNm` nautical miles from `from` on bearing
 * `bearingDeg`. Used for dead reckoning between position updates so aircraft
 * glide across the map instead of jumping every poll.
 */
export function destinationPoint(from: LngLat, bearingDeg: number, distNm: number): LngLat {
  if (distNm === 0) return { lon: from.lon, lat: from.lat };
  const d = distNm / R_EARTH_NM;
  const brg = bearingDeg * D2R;
  const lat1 = from.lat * D2R;
  const lon1 = from.lon * D2R;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brg),
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brg) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
    );

  return {
    lat: lat2 * R2D,
    lon: (((lon2 * R2D + 540) % 360) - 180),
  };
}
