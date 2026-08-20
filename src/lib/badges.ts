import type { Logbook, Stats } from './logbook';
import { localDay } from './logbook';

/**
 * Badges.
 *
 * Design notes, since these are the whole retention mechanism:
 *  - The first badge unlocks on the very first plane clicked. Duolingo's own
 *    data shows a day-one achievement roughly doubles the odds someone comes
 *    back, and a locked wall of grey squares is the fastest way to lose a kid.
 *  - Every badge is reachable by watching real aeroplanes. None of them ask for
 *    money, an account, or a share.
 *  - A streak survives until a full day is missed, not until midnight.
 *
 * Names and hints live in messages/<locale>.json under `badges.<id>`.
 */

export type Tier = 'bronze' | 'silver' | 'gold';

export interface BadgeDef {
  id: string;
  symbol: string;
  tier: Tier;
  earned: (stats: Stats, book: Logbook) => boolean;
  /** Optional 0..1 progress for locked badges. */
  progress?: (stats: Stats, book: Logbook) => number;
}

const hasTypePrefix = (stats: Stats, prefix: string) =>
  stats.types.some((t) => t.startsWith(prefix));

const ratio = (have: number, need: number) => Math.max(0, Math.min(1, have / need));

export const BADGES: BadgeDef[] = [
  {
    id: 'first_spot',
    symbol: '✦',
    tier: 'bronze',
    earned: (s) => s.planes >= 1,
    progress: (s) => ratio(s.planes, 1),
  },
  {
    id: 'five_planes',
    symbol: '✈',
    tier: 'bronze',
    earned: (s) => s.planes >= 5,
    progress: (s) => ratio(s.planes, 5),
  },
  {
    id: 'twentyfive_planes',
    symbol: '✈',
    tier: 'silver',
    earned: (s) => s.planes >= 25,
    progress: (s) => ratio(s.planes, 25),
  },
  {
    id: 'hundred_planes',
    symbol: '✈',
    tier: 'gold',
    earned: (s) => s.planes >= 100,
    progress: (s) => ratio(s.planes, 100),
  },
  {
    id: 'type_collector',
    symbol: '◈',
    tier: 'silver',
    earned: (s) => s.types.length >= 10,
    progress: (s) => ratio(s.types.length, 10),
  },
  {
    id: 'jumbo',
    symbol: '◤',
    tier: 'silver',
    earned: (s) => hasTypePrefix(s, 'B74'),
  },
  {
    id: 'superjumbo',
    symbol: '◆',
    tier: 'gold',
    earned: (s) => s.types.includes('A388'),
  },
  {
    id: 'dreamliner',
    symbol: '◐',
    tier: 'bronze',
    earned: (s) => hasTypePrefix(s, 'B78'),
  },
  {
    id: 'triple_seven',
    symbol: '◑',
    tier: 'bronze',
    earned: (s) => hasTypePrefix(s, 'B77'),
  },
  {
    id: 'five_airlines_day',
    symbol: '★',
    tier: 'silver',
    earned: (s) => s.airlinesToday >= 5,
    progress: (s) => ratio(s.airlinesToday, 5),
  },
  {
    id: 'world_tour',
    symbol: '⊕',
    tier: 'silver',
    earned: (s) => s.countries.length >= 5,
    progress: (s) => ratio(s.countries.length, 5),
  },
  {
    id: 'globe_trotter',
    symbol: '⊛',
    tier: 'gold',
    earned: (s) => s.countries.length >= 10,
    progress: (s) => ratio(s.countries.length, 10),
  },
  {
    id: 'streak_3',
    symbol: '▲',
    tier: 'bronze',
    earned: (s) => s.streak >= 3,
    progress: (s) => ratio(s.streak, 3),
  },
  {
    id: 'streak_7',
    symbol: '▲',
    tier: 'gold',
    earned: (s) => s.streak >= 7,
    progress: (s) => ratio(s.streak, 7),
  },
  {
    id: 'high_flyer',
    symbol: '↑',
    tier: 'bronze',
    earned: (s) => s.highestAlt >= 40_000,
    progress: (s) => ratio(s.highestAlt, 40_000),
  },
  {
    id: 'speed_demon',
    symbol: '»',
    tier: 'silver',
    earned: (s) => s.fastest >= 550,
    progress: (s) => ratio(s.fastest, 550),
  },
  {
    id: 'cargo_hunter',
    symbol: '▣',
    tier: 'bronze',
    earned: (s) => s.cargoSeen,
  },
  {
    id: 'night_owl',
    symbol: '☾',
    tier: 'silver',
    earned: (_s, book) =>
      Object.values(book.sightings).some((x) => {
        const h = new Date(x.last).getHours();
        return h >= 22 || h < 5;
      }),
  },
];

export const BADGE_IDS = BADGES.map((b) => b.id);

/**
 * Award any newly-qualified badges.
 * Returns the updated book plus the ids earned in this call, so the UI can
 * celebrate exactly once.
 */
export function evaluateBadges(
  book: Logbook,
  stats: Stats,
  now = Date.now(),
): { book: Logbook; newlyEarned: string[] } {
  const newlyEarned: string[] = [];
  const badges = { ...book.badges };

  for (const def of BADGES) {
    if (badges[def.id]) continue;
    if (def.earned(stats, book)) {
      badges[def.id] = now;
      newlyEarned.push(def.id);
    }
  }

  if (newlyEarned.length === 0) return { book, newlyEarned };
  return { book: { ...book, badges }, newlyEarned };
}

/** Badges earned today, used for the "what you got today" strip. */
export function earnedToday(book: Logbook, now = Date.now()): string[] {
  const today = localDay(now);
  return Object.entries(book.badges)
    .filter(([, t]) => localDay(t) === today)
    .map(([id]) => id);
}
