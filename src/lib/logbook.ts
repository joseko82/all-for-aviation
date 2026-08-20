'use client';

import type { Aircraft } from './types';
import { airlinePrefix, AIRLINES } from './airlines';

/**
 * The spotting logbook.
 *
 * Everything lives in this browser's localStorage. No account, no server, no
 * personal data leaves the device — which is both the right call for a site
 * aimed at a child and the reason this feature costs nothing to run.
 */

const KEY = 'afa.logbook.v1';

export interface Sighting {
  /** ICAO 24-bit address — the aircraft's permanent identity. */
  id: string;
  reg: string;
  type: string;
  cs: string;
  /** ICAO airline prefix, e.g. "KAL". Null for unknown or private flights. */
  airline: string | null;
  first: number;
  last: number;
  count: number;
  /** Highest altitude we have seen this airframe at, in feet. */
  maxAlt: number;
  /** Highest ground speed we have seen, in knots. */
  maxGs: number;
}

export interface Logbook {
  v: 1;
  sightings: Record<string, Sighting>;
  /** Local calendar dates the site was opened, "YYYY-MM-DD", ascending. */
  days: string[];
  /** badge id -> epoch ms when it was earned. */
  badges: Record<string, number>;
}

export const EMPTY: Logbook = { v: 1, sightings: {}, days: [], badges: {} };

export function localDay(t = Date.now()): string {
  const d = new Date(t);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function load(): Logbook {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY, sightings: {}, days: [], badges: {} };
    const parsed = JSON.parse(raw) as Logbook;
    if (parsed?.v !== 1 || typeof parsed.sightings !== 'object') return { ...EMPTY };
    return {
      v: 1,
      sightings: parsed.sightings ?? {},
      days: Array.isArray(parsed.days) ? parsed.days : [],
      badges: parsed.badges ?? {},
    };
  } catch {
    // Corrupt or unavailable storage (private mode, quota) — start clean rather
    // than crashing the map.
    return { ...EMPTY, sightings: {}, days: [], badges: {} };
  }
}

export function save(book: Logbook): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(book));
  } catch {
    // Storage full or blocked. The logbook is a bonus, never a blocker.
  }
}

/** Record that the site was opened today. Returns the updated book. */
export function recordVisit(book: Logbook, now = Date.now()): Logbook {
  const today = localDay(now);
  if (book.days[book.days.length - 1] === today) return book;
  if (book.days.includes(today)) return book;
  return { ...book, days: [...book.days, today].sort() };
}

/** Record a spotted aircraft. Returns the updated book. */
export function recordSighting(book: Logbook, a: Aircraft, now = Date.now()): Logbook {
  const existing = book.sightings[a.id];
  const sighting: Sighting = existing
    ? {
        ...existing,
        // Later sightings often carry better metadata than the first one.
        reg: a.reg || existing.reg,
        type: a.type || existing.type,
        cs: a.cs || existing.cs,
        airline: airlinePrefix(a.cs) ?? existing.airline,
        last: now,
        count: existing.count + 1,
        maxAlt: Math.max(existing.maxAlt, a.alt),
        maxGs: Math.max(existing.maxGs, a.gs),
      }
    : {
        id: a.id,
        reg: a.reg,
        type: a.type,
        cs: a.cs,
        airline: airlinePrefix(a.cs),
        first: now,
        last: now,
        count: 1,
        maxAlt: a.alt,
        maxGs: a.gs,
      };

  return { ...book, sightings: { ...book.sightings, [a.id]: sighting } };
}

// ---------------------------------------------------------------------------
// Derived statistics
// ---------------------------------------------------------------------------

export interface Stats {
  planes: number;
  sightings: number;
  types: string[];
  airlines: string[];
  countries: string[];
  /** Consecutive days ending today (or yesterday, so a streak survives until midnight). */
  streak: number;
  daysVisited: number;
  highestAlt: number;
  fastest: number;
  /** Distinct airlines seen today. */
  airlinesToday: number;
  cargoSeen: boolean;
}

export function computeStats(book: Logbook, now = Date.now()): Stats {
  const list = Object.values(book.sightings);
  const types = new Set<string>();
  const airlines = new Set<string>();
  const countries = new Set<string>();
  const airlinesToday = new Set<string>();
  const today = localDay(now);

  let sightings = 0;
  let highestAlt = 0;
  let fastest = 0;
  let cargoSeen = false;

  for (const s of list) {
    sightings += s.count;
    if (s.type) types.add(s.type.toUpperCase());
    if (s.airline) {
      airlines.add(s.airline);
      const meta = AIRLINES[s.airline];
      if (meta) {
        countries.add(meta.country);
        if (meta.cargo) cargoSeen = true;
      }
      if (localDay(s.last) === today) airlinesToday.add(s.airline);
    }
    highestAlt = Math.max(highestAlt, s.maxAlt);
    fastest = Math.max(fastest, s.maxGs);
  }

  return {
    planes: list.length,
    sightings,
    types: [...types].sort(),
    airlines: [...airlines].sort(),
    countries: [...countries].sort(),
    streak: computeStreak(book.days, now),
    daysVisited: book.days.length,
    highestAlt,
    fastest,
    airlinesToday: airlinesToday.size,
    cargoSeen,
  };
}

/**
 * Length of the run of consecutive days ending today.
 *
 * A streak that was last extended yesterday still counts — it only breaks once
 * a whole day has been missed. Being stricter than that punishes a child for
 * going to bed.
 */
export function computeStreak(days: string[], now = Date.now()): number {
  if (days.length === 0) return 0;

  const today = localDay(now);
  const yesterday = localDay(now - 86_400_000);
  const last = days[days.length - 1];
  if (last !== today && last !== yesterday) return 0;

  const set = new Set(days);
  let streak = 0;
  const cursor = new Date(last + 'T12:00:00');
  for (;;) {
    const key = localDay(cursor.getTime());
    if (!set.has(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
