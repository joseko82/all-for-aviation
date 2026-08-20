import { defineRouting } from 'next-intl/routing';

/**
 * i18n routing configuration.
 *
 * Phase 1 ships English only, but every URL already carries a locale segment
 * (`/en/...`). Adding Korean later is a two-line change here plus a new
 * `messages/ko.json` — no URLs break, no components change.
 */
export const routing = defineRouting({
  locales: ['en'],
  defaultLocale: 'en',
  // Always show the locale in the URL so /en/... is stable from day one.
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];

/**
 * Default unit system per locale.
 * Aviation convention (US/UK) is feet + knots; metric locales read better in
 * metres + km/h. All internal values stay in the raw ADS-B units (ft, kt) and
 * are converted only at render time — see src/lib/format.ts.
 */
export const localeUnits: Record<Locale, 'imperial' | 'metric'> = {
  en: 'imperial',
};
