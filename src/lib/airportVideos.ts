/**
 * Curated cockpit and landing videos, by airport.
 *
 * Every id below was read from a real youtube.com/watch?v= URL and then
 * confirmed live through YouTube's oEmbed endpoint, which returns the title and
 * channel only for a video that exists and is public. Titles here are those
 * oEmbed values, so they match what YouTube actually serves.
 *
 * Two things oEmbed cannot tell us: whether the owner has disabled third-party
 * embedding, and whether the video will still be there next year. The UI
 * therefore always offers a direct youtube.com link alongside the player, so a
 * blocked or removed embed degrades to a working link rather than a dead box.
 *
 * No player iframe is created until the child presses play, so the page sets no
 * YouTube cookie on its own. The still image on each card is still fetched from
 * i.ytimg.com, and the wording on the page says so rather than over-claiming.
 */

export interface AirportVideo {
  /** YouTube video id — the 11 characters after `v=`. */
  id: string;
  title: string;
  channel: string;
  kind: 'cockpit' | 'landing' | 'historic';
}

/** Keyed by ICAO code, matching src/lib/hubs.ts. */
export const AIRPORT_VIDEOS: Record<string, AirportVideo[]> = {
  RKSI: [
    {
      id: 'pUrWzeTzXxI',
      title: 'B777 ICN Seoul Incheon — Landing 34L, 4K cockpit view with ATC',
      channel: 'InZeAir84',
      kind: 'cockpit',
    },
    {
      id: 'xcYfD2fU9eI',
      title: 'Korean Air Boeing 747-8I landing at Incheon',
      channel: 'TinnTinngo',
      kind: 'landing',
    },
    {
      id: '9oOlGx9IeMo',
      title: 'Asiana Boeing 747-400 approach and landing at Incheon',
      channel: 'Avi The Aviator',
      kind: 'landing',
    },
  ],
  RJTT: [
    {
      id: 'IIEFiUyIYm8',
      title: 'Lufthansa A350 hand-flown landing at Tokyo Haneda — pilot view',
      channel: 'Air-Clips.com',
      kind: 'cockpit',
    },
    {
      id: 'Cvoo6vQ5qNQ',
      title: 'Boeing 777 landing at Tokyo Haneda runway 22 — 4K',
      channel: 'High Pressure Aviation Films',
      kind: 'landing',
    },
    {
      id: 'mBfuD0nzBtw',
      title: 'Hand-flown circle-to-land at Tokyo Haneda — pilots-eye view',
      channel: 'BlueLineSpeed',
      kind: 'cockpit',
    },
  ],
  VHHH: [
    {
      id: 'QfbTEuUvX7s',
      title: 'Boeing 777 cockpit view landing at Hong Kong',
      channel: 'TT Aviation',
      kind: 'cockpit',
    },
    {
      id: 'DAFoMBVQ8Y0',
      title: 'Cathay Pacific 777 approach into Hong Kong just after sunrise',
      channel: 'settime2588',
      kind: 'landing',
    },
    {
      id: 'lx3Ccs5tKfw',
      title: 'Kai Tak, 1998 — the famous checkerboard turn (the old Hong Kong airport)',
      channel: 'AIRBOYD',
      kind: 'historic',
    },
  ],
  WSSS: [
    {
      id: 'arH2zzG2ju0',
      title: 'Boeing 777 landing at Singapore Changi runway 20R — cockpit view',
      channel: 'DutchPilotGirl',
      kind: 'cockpit',
    },
    {
      id: 'WQY_stjQtUw',
      title: 'Singapore Changi — Boeing 777 landing in 4K',
      channel: 'High Pressure Aviation Films',
      kind: 'landing',
    },
  ],
  OMDB: [
    {
      id: 'bNWWkvQ65Yk',
      title: 'Emirates A380 cockpit landing on Dubai runway 30R',
      channel: 'FlightMat',
      kind: 'cockpit',
    },
    {
      id: 'YySD1QL5b0Y',
      title: 'Emirates A380 night landing at Dubai — cockpit view',
      channel: 'FlightCockpitView',
      kind: 'cockpit',
    },
  ],
  EGLL: [
    {
      id: 'G1aslSE4JWA',
      title: 'Airbus A380 landing at London Heathrow — cockpit, pilot and wing views',
      channel: 'Just Planes',
      kind: 'cockpit',
    },
    {
      id: 'zLH1ZHNdtVQ',
      title: 'British Airways A380 landing on Heathrow runway 27R',
      channel: 'Airport Action',
      kind: 'landing',
    },
  ],
  KJFK: [
    {
      id: '6MADRBeTbfM',
      title: 'B777 New York JFK — landing 04R, 4K cockpit view with ATC',
      channel: 'InZeAir84',
      kind: 'cockpit',
    },
    {
      id: 'E9hrGDeATqI',
      title: 'New York JFK — Boeing 777 landing in 4K',
      channel: 'High Pressure Aviation Films',
      kind: 'landing',
    },
  ],
  KLAX: [
    {
      id: 'mtOGvW70Ea4',
      title: 'B777 landing at Los Angeles — cockpit view with ATC',
      channel: 'InZeAir84',
      kind: 'cockpit',
    },
    {
      id: 'zYoQOsCxHr0',
      title: 'Landing at Los Angeles International — cockpit view',
      channel: 'AeroWorldpicturesHD',
      kind: 'cockpit',
    },
  ],
  EHAM: [
    {
      id: 'bbdI9FH-_oA',
      title: 'Boeing 737 landing at Amsterdam Schiphol runway 36C — cockpit view',
      channel: 'DutchPilotGirl',
      kind: 'cockpit',
    },
    {
      id: 'utwhgEBpioY',
      title: 'A319 Amsterdam — landing 18R, 4K cockpit view with ATC',
      channel: 'InZeAir84',
      kind: 'cockpit',
    },
  ],
  YSSY: [
    {
      id: 'DCVsaJpjJP8',
      title: 'Boeing 737 cockpit landing at Sydney with HUD',
      channel: 'Air-Clips.com',
      kind: 'cockpit',
    },
    {
      id: '4znCpIsufUw',
      title: 'Rainy morning approach and landing into Sydney',
      channel: 'Pilotalk Show',
      kind: 'landing',
    },
  ],
};

export function videosFor(icao: string | undefined): AirportVideo[] {
  if (!icao) return [];
  return AIRPORT_VIDEOS[icao.toUpperCase()] ?? [];
}

export function hasVideos(icao: string | undefined): boolean {
  return videosFor(icao).length > 0;
}

/** Airports with at least one video, in the order they appear above. */
export const AIRPORTS_WITH_VIDEOS = Object.keys(AIRPORT_VIDEOS);
