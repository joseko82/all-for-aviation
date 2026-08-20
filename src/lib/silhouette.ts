import type { AircraftSpec } from './aircraftSpecs';
import { fuselageWidthM } from './aircraftSpecs';

/**
 * Plan-view (from above) aircraft silhouettes, drawn in real metres.
 *
 * Everything is generated from the published length and wingspan, so two
 * aircraft drawn on the same scale really are the right size relative to each
 * other. The wing sweep and nacelle placement are stylised — the point is an
 * honest sense of scale, not an engineering drawing.
 *
 * Coordinates: nose at x = 0, tail at x = length, centreline at y = 0.
 */

export interface SilhouettePaths {
  fuselage: string;
  wings: string;
  tail: string;
  engines: string[];
  lengthM: number;
  spanM: number;
}

export function buildSilhouette(spec: AircraftSpec): SilhouettePaths {
  const L = spec.lengthM;
  const B = spec.wingspanM;
  const W = fuselageWidthM(spec);
  const h = W / 2;
  const n = (v: number) => Number(v.toFixed(2));

  const fuselage = [
    `M ${n(0)} ${n(0)}`,
    `C ${n(0.03 * L)} ${n(-h * 0.75)} ${n(0.08 * L)} ${n(-h)} ${n(0.14 * L)} ${n(-h)}`,
    `L ${n(0.78 * L)} ${n(-h)}`,
    `C ${n(0.9 * L)} ${n(-h)} ${n(0.96 * L)} ${n(-h * 0.4)} ${n(L)} ${n(-h * 0.12)}`,
    `L ${n(L)} ${n(h * 0.12)}`,
    `C ${n(0.96 * L)} ${n(h * 0.4)} ${n(0.9 * L)} ${n(h)} ${n(0.78 * L)} ${n(h)}`,
    `L ${n(0.14 * L)} ${n(h)}`,
    `C ${n(0.08 * L)} ${n(h)} ${n(0.03 * L)} ${n(h * 0.75)} ${n(0)} ${n(0)}`,
    'Z',
  ].join(' ');

  const wingHalf = (sign: number) =>
    [
      `M ${n(0.38 * L)} ${n(sign * h * 0.95)}`,
      `L ${n(0.68 * L)} ${n((sign * B) / 2)}`,
      `L ${n(0.725 * L)} ${n((sign * B) / 2)}`,
      `L ${n(0.60 * L)} ${n(sign * h * 0.95)}`,
      'Z',
    ].join(' ');

  const tailHalf = (sign: number) =>
    [
      `M ${n(0.885 * L)} ${n(sign * h * 0.85)}`,
      `L ${n(0.975 * L)} ${n(sign * B * 0.17)}`,
      `L ${n(0.998 * L)} ${n(sign * B * 0.17)}`,
      `L ${n(0.96 * L)} ${n(sign * h * 0.85)}`,
      'Z',
    ].join(' ');

  // Nacelle geometry: length scales with the aircraft, diameter with the body.
  const nacL = 0.085 * L;
  const nacR = W * 0.28;
  const engineAt = (spanFraction: number, sign: number) => {
    const y = (sign * B * spanFraction) / 2;
    // Engines sit ahead of the wing leading edge at that span station.
    const leadingEdgeX = 0.38 * L + (0.68 * L - 0.38 * L) * spanFraction;
    const x0 = leadingEdgeX - nacL * 0.75;
    return [
      `M ${n(x0)} ${n(y - nacR)}`,
      `L ${n(x0 + nacL)} ${n(y - nacR)}`,
      `L ${n(x0 + nacL)} ${n(y + nacR)}`,
      `L ${n(x0)} ${n(y + nacR)}`,
      'Z',
    ].join(' ');
  };

  const engines =
    spec.engines === 4
      ? [
          engineAt(0.42, -1), engineAt(0.72, -1),
          engineAt(0.42, 1), engineAt(0.72, 1),
        ]
      : [engineAt(0.5, -1), engineAt(0.5, 1)];

  return {
    fuselage,
    wings: `${wingHalf(-1)} ${wingHalf(1)}`,
    tail: `${tailHalf(-1)} ${tailHalf(1)}`,
    engines,
    lengthM: L,
    spanM: B,
  };
}
