/**
 * The daily aviation-humour pool.
 *
 * How these were chosen, because it matters more than usual here:
 *
 *  - Every id was read out of a real youtube.com/watch?v= URL and then
 *    confirmed through YouTube's oEmbed endpoint, which returns a title and
 *    channel only for a video that exists and is public. The titles below are
 *    those oEmbed values.
 *  - The bar is wordplay and silliness. Nothing about crashes, near-misses,
 *    emergencies, mayday calls or "scariest landing" content — that whole genre
 *    is excluded on purpose, and eight otherwise-funny candidates were dropped
 *    for touching it.
 *  - ATC compilations were dropped too: a compilation's title tells you nothing
 *    about minute nine.
 *  - `official` marks a video on the channel of the airline or creator that
 *    made it. Re-uploads are marked false — they are fine to watch but can be
 *    taken down, and we cannot see what else that uploader posts.
 *
 * A fixed pool rather than a live search or channel feed is a deliberate
 * trade: it means nothing can appear here that a person has not looked at
 * first. Refreshing it is a one-file edit.
 */

export type MemeKind = 'safety-parody' | 'atc-humour' | 'animation' | 'advert' | 'cabin-crew';

export interface Meme {
  id: string;
  title: string;
  channel: string;
  kind: MemeKind;
  official: boolean;
}

export const MEMES: Meme[] = [
  // --- airline safety-video parodies ---------------------------------------
  { id: 'qOw44VFNk8Y', title: 'The Most Epic Safety Video Ever Made', channel: 'Air New Zealand', kind: 'safety-parody', official: true },
  { id: 'cBlRbrB_Gnc', title: 'An Unexpected Briefing', channel: 'Air New Zealand', kind: 'safety-parody', official: true },
  { id: 'O-5gjkh4r3g', title: 'Betty White — Safety Old School Style', channel: 'Air New Zealand', kind: 'safety-parody', official: true },
  { id: 'dYu8kkD0Gy4', title: "It's Kiwi Safety", channel: 'Air New Zealand', kind: 'safety-parody', official: true },
  { id: 'X6El8XiODwE', title: 'Safety in Hollywood', channel: 'Air New Zealand', kind: 'safety-parody', official: true },
  { id: '3iaTEgoezNQ', title: 'Mile-high madness with Richard Simmons', channel: 'Air New Zealand', kind: 'safety-parody', official: true },
  { id: 'yGWX38k9nhY', title: 'Men In Black Safety Defenders', channel: 'Air New Zealand (re-upload)', kind: 'safety-parody', official: false },
  { id: 'puEvbxyh6lU', title: 'Crazy About Rugby safety video', channel: 'Air New Zealand (re-upload)', kind: 'safety-parody', official: false },
  { id: 'z1A5BtqsaPM', title: 'Virgin America Safety Video — the safety dance', channel: 'Todrick Hall', kind: 'safety-parody', official: true },
  { id: 'FQ9Xpzi4qkU', title: 'Safety Video Sequel — The Director’s Cut', channel: 'British Airways', kind: 'safety-parody', official: true },
  { id: 'YCoQwZ9BQ9Q', title: 'Safety Video — Director’s Cut', channel: 'British Airways', kind: 'safety-parody', official: true },
  { id: 'h_GWVEozF58', title: 'Safety Video with Zach King', channel: 'Turkish Airlines (re-upload)', kind: 'safety-parody', official: false },
  { id: 'poopKMMQ8Cg', title: "Delta's 80s In-Flight Safety Video", channel: 'Delta (re-upload)', kind: 'safety-parody', official: false },
  { id: 'H99sJ0zP6ec', title: "Delta's Safety Video — “Deltalina”", channel: 'Delta (re-upload)', kind: 'safety-parody', official: false },

  // --- animation -----------------------------------------------------------
  { id: 'WmcFKtzcKbQ', title: "Ed & Melanie's Safety Sketch", channel: 'Air New Zealand', kind: 'animation', official: true },
  { id: 'eyygn8HFTCo', title: 'Virgin America Safety Video (the cartoon one)', channel: 'Virgin America (re-upload)', kind: 'animation', official: false },
  { id: 'zQtod9801j0', title: 'LEGO Movie Safety Video', channel: 'Turkish Airlines (re-upload)', kind: 'animation', official: false },
  { id: '_blVWcSNGbU', title: 'Safety Video with The LEGO Movie 2 Characters', channel: 'Turkish Airlines (re-upload)', kind: 'animation', official: false },
  { id: 'ZDP2Nj6wHxE', title: 'STARWONDERERS Safety Film', channel: 'STARLUX Airlines', kind: 'animation', official: true },

  // --- air traffic control wordplay ----------------------------------------
  { id: 'bDYtb-Jw1jw', title: "Kennedy Steve: I'm the ground controller!", channel: 'ATCTranscripts', kind: 'atc-humour', official: true },
  { id: 'wBSmlGBSdA8', title: 'Kennedy Steve: This is Ground, sir!', channel: 'ATCTranscripts', kind: 'atc-humour', official: true },
  { id: '1rjRQ4ravq4', title: 'Kennedy Steve: Oh really!', channel: 'ATCTranscripts', kind: 'atc-humour', official: true },

  // --- cabin crew ----------------------------------------------------------
  { id: 'aXY27Rwg6UQ', title: 'Christmas Safety Demo Dance', channel: 'Cebu Pacific Air', kind: 'cabin-crew', official: true },
  { id: 'IUROFhkpVbM', title: 'The Safety Dance — female crew', channel: 'Cebu Pacific Air', kind: 'cabin-crew', official: true },
  { id: 'JjapY4U0-HY', title: 'The Safety Dance — male crew', channel: 'Cebu Pacific Air', kind: 'cabin-crew', official: true },
  { id: '07LFBydGjaM', title: 'The funniest flight attendant on Southwest', channel: 'Marty Cobb', kind: 'cabin-crew', official: true },

  // --- adverts -------------------------------------------------------------
  { id: 'F7qpixvwtV0', title: 'Dave the Goose is back', channel: 'Air New Zealand (via Travel Daily)', kind: 'advert', official: false },
  { id: 'xJb4fT3B48o', title: 'Gerry The Goose Flies Better', channel: 'Emirates (via Ads of Brands)', kind: 'advert', official: false },
  { id: 'HO60IAY3z24', title: 'Jennifer Aniston gets cheeky', channel: 'Emirates (via Emirates247)', kind: 'advert', official: false },
  { id: 'sglx-nKobcI', title: 'Dave the Goose answers back', channel: 'Air New Zealand (via Karryon)', kind: 'advert', official: false },
];

// ---------------------------------------------------------------------------
// Daily rotation
// ---------------------------------------------------------------------------

const DAY_MS = 86_400_000;

/**
 * Days since 1970 in the viewer's own timezone.
 *
 * Computed from the local clock rather than UTC so the video changes at the
 * child's midnight, not at some hour in the middle of his afternoon.
 */
export function dayNumber(now: Date = new Date()): number {
  const localMs = now.getTime() - now.getTimezoneOffset() * 60_000;
  return Math.floor(localMs / DAY_MS);
}

/** Deterministic shuffle, seeded so a given cycle always produces one order. */
function shuffledPool(cycle: number, pool: Meme[] = MEMES): Meme[] {
  let s = (cycle * 2_654_435_761 + 12_345) >>> 0 || 1;
  const rand = () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return s / 0x1_0000_0000;
  };
  const out = [...pool];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The video for a given day.
 *
 * The pool is walked in a shuffled order and reshuffled each time it is
 * exhausted, so nothing repeats until every video has been shown once — a
 * plain random pick would show the same clip twice in a week often enough to
 * be noticed.
 */
export function memeForDay(day: number, pool: Meme[] = MEMES): Meme {
  const n = pool.length;
  const cycle = Math.floor(day / n);
  const offset = ((day % n) + n) % n;
  return shuffledPool(cycle, pool)[offset];
}

/** Today's video plus the previous `count` days, newest first. */
export function recentMemes(day: number, count = 3, pool: Meme[] = MEMES): Meme[] {
  return Array.from({ length: count }, (_, i) => memeForDay(day - 1 - i, pool));
}

/** How many days before the pool starts over. */
export const CYCLE_DAYS = MEMES.length;
