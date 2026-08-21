/**
 * The site's sections, in one place.
 *
 * Both the header navigation and the in-site guide read this list, so adding a
 * section makes it appear in the guide automatically rather than leaving the
 * manual quietly out of date. The wording lives in messages/<locale>.json under
 * `nav.<key>` and `guide.section.<key>`.
 */
export interface Section {
  key: 'map' | 'compare' | 'learn' | 'airports' | 'fun' | 'game' | 'guide';
  /** Path after the locale prefix. Empty string is the map. */
  path: string;
  /** Shown in the header nav. */
  inNav: boolean;
  /** Described in the guide. The guide does not describe itself. */
  inGuide: boolean;
}

export const SECTIONS: Section[] = [
  { key: 'map', path: '', inNav: true, inGuide: true },
  { key: 'compare', path: '/compare', inNav: true, inGuide: true },
  { key: 'learn', path: '/learn', inNav: true, inGuide: true },
  { key: 'airports', path: '/airports', inNav: true, inGuide: true },
  { key: 'fun', path: '/fun', inNav: true, inGuide: true },
  { key: 'game', path: '/game', inNav: true, inGuide: true },
  // Reachable from the header's utility group rather than the section list —
  // help sits beside the logbook, not beside the content.
  { key: 'guide', path: '/guide', inNav: false, inGuide: false },
];

export function sectionHref(locale: string, s: Section): string {
  return `/${locale}${s.path}`;
}

export function isActive(pathname: string, locale: string, s: Section): boolean {
  const href = sectionHref(locale, s);
  return s.path === '' ? pathname === href : pathname.startsWith(href);
}
