import { AIRPORTS, FAMOUS_AIRPORTS, type GameAirport } from './airports';
import { SPECS, type AircraftSpec } from './aircraftSpecs';
import { distanceNm, type LngLat } from './geo';

/**
 * The five-round guessing game.
 *
 * Two round types, both built from assets we already own:
 *  - "which aircraft is this?" reuses the silhouette generator from the size
 *    comparison page, so there is no photo licensing question at all;
 *  - "where is this airport?" is scored by how far the guess lands from the
 *    truth, which rewards partial knowledge instead of punishing it.
 */

export const ROUNDS_PER_GAME = 5;
export const MAX_ROUND_SCORE = 1000;

export type Round =
  | { kind: 'aircraft'; answer: AircraftSpec; options: AircraftSpec[] }
  | { kind: 'airport'; answer: GameAirport };

export interface RoundResult {
  score: number;
  /** Distance in kilometres, for airport rounds. */
  distanceKm?: number;
  correct: boolean;
}

/** Deterministic shuffle so a seeded game can be reproduced in a test. */
export function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Small seeded generator — enough for shuffling, and testable. */
export function makeRandom(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 0x1_0000_0000;
  };
}

/**
 * Two aircraft of nearly the same length with the same number of engines draw
 * as the same silhouette — an A350-1000 and a 777-300ER are both twin-engine
 * and within a metre of each other. Offering both makes the round a coin flip,
 * so anything that close is not allowed as a wrong answer.
 */
export function isDistinguishable(a: AircraftSpec, b: AircraftSpec): boolean {
  if (a.engines !== b.engines) return true;
  const lengthGap = Math.abs(a.lengthM - b.lengthM) / Math.max(a.lengthM, b.lengthM);
  const spanGap = Math.abs(a.wingspanM - b.wingspanM) / Math.max(a.wingspanM, b.wingspanM);
  return lengthGap >= 0.12 || spanGap >= 0.12;
}

/**
 * Pick three wrong answers that are plausible but tellable apart: a spread of
 * size classes, so the silhouette actually decides the round.
 */
function distractorsFor(answer: AircraftSpec, rand: () => number): AircraftSpec[] {
  const others = SPECS.filter(
    (s) => s.code !== answer.code && isDistinguishable(s, answer),
  );
  const sized = shuffle(others, rand).sort((x, y) => {
    const dx = Math.abs(x.lengthM - answer.lengthM);
    const dy = Math.abs(y.lengthM - answer.lengthM);
    return dy - dx; // most different first
  });

  const picks = [sized[0], sized[Math.floor(sized.length / 2)], sized[sized.length - 1]];
  return picks.filter(
    (s, i, arr): s is AircraftSpec =>
      Boolean(s) && arr.findIndex((o) => o && o.code === s.code) === i,
  );
}

export function buildGame(seed: number): Round[] {
  const rand = makeRandom(seed);

  const planes = shuffle(SPECS, rand).slice(0, 3);
  const famous = shuffle(FAMOUS_AIRPORTS, rand)[0];
  const anyAirport = shuffle(
    AIRPORTS.filter((a) => a.iata !== famous.iata),
    rand,
  )[0];

  const aircraftRounds: Round[] = planes.map((answer) => ({
    kind: 'aircraft' as const,
    answer,
    options: shuffle([answer, ...distractorsFor(answer, rand)], rand),
  }));

  const airportRounds: Round[] = [
    { kind: 'airport' as const, answer: famous },
    { kind: 'airport' as const, answer: anyAirport },
  ];

  // Open with an airport (easier to attempt) and alternate from there.
  return [
    airportRounds[0],
    aircraftRounds[0],
    aircraftRounds[1],
    airportRounds[1],
    aircraftRounds[2],
  ];
}

const NM_TO_KM = 1.852;

/**
 * Distance score. 1000 points for a bullseye, decaying with distance:
 * roughly 600 at 500 km, 250 at 1500 km, and still 60 at 4000 km — so a guess
 * on the right continent is always worth something.
 */
export function scoreDistance(guess: LngLat, truth: LngLat): RoundResult {
  const km = distanceNm(guess, truth) * NM_TO_KM;
  const score = Math.round(MAX_ROUND_SCORE * Math.exp(-km / 1400));
  return { score, distanceKm: Math.round(km), correct: km < 150 };
}

export function scoreAircraft(picked: string, answer: string): RoundResult {
  const correct = picked === answer;
  return { score: correct ? MAX_ROUND_SCORE : 0, correct };
}

export function gameRank(total: number): 'ace' | 'captain' | 'pilot' | 'cadet' {
  if (total >= 4200) return 'ace';
  if (total >= 3200) return 'captain';
  if (total >= 2000) return 'pilot';
  return 'cadet';
}
