'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import SiteNav from './SiteNav';
import { useLogbook } from './LogbookProvider';
import { SECTIONS, sectionHref } from '@/lib/sections';
import { BADGES } from '@/lib/badges';
import { TOTAL_LEARN_CARDS } from '@/lib/learn';
import { SPECS } from '@/lib/aircraftSpecs';
import { AIRPORT_VIDEOS } from '@/lib/airportVideos';
import { HUBS } from '@/lib/hubs';
import { MAX_ROUND_SCORE, ROUNDS_PER_GAME } from '@/lib/game';

/**
 * The handbook, living inside the site.
 *
 * Every number below is read from the same module the feature itself uses, so
 * adding a badge, a learning card or an aircraft updates this page on the next
 * build. A separate document would have started drifting the first time we
 * shipped anything; this cannot.
 */
export default function Guide() {
  const t = useTranslations('guide');
  const tn = useTranslations('nav');
  const locale = useLocale();
  const { stats, book } = useLogbook();

  const counts = {
    badges: BADGES.length,
    cards: TOTAL_LEARN_CARDS,
    aircraft: SPECS.length,
    hubs: HUBS.length,
    videoAirports: Object.keys(AIRPORT_VIDEOS).length,
    videos: Object.values(AIRPORT_VIDEOS).reduce((n, v) => n + v.length, 0),
    rounds: ROUNDS_PER_GAME,
    topScore: ROUNDS_PER_GAME * MAX_ROUND_SCORE,
  };

  const described = SECTIONS.filter((s) => s.inGuide);
  const started = stats.planes > 0 || stats.cardsTried > 0 || stats.gamesPlayed > 0;

  return (
    <div className="page">
      <SiteNav />
      <main className="page-body guide">
        <section className="dedication">
          <p className="dedication-lead">{t('dedicationLead')}</p>
          <p className="dedication-name">{t('dedicationName')}</p>
          <p className="dedication-tail">{t('dedicationTail')}</p>
        </section>

        <h2 className="page-title">{t('title')}</h2>
        <p className="page-lede">{t('lede')}</p>

        <section className="guide-block">
          <h3>{t('startTitle')}</h3>
          <ol className="guide-steps">
            <li><span>{t('step1')}</span></li>
            <li><span>{t('step2')}</span></li>
            <li><span>{t('step3')}</span></li>
          </ol>
        </section>

        <section className="guide-block">
          <h3>{t('sectionsTitle')}</h3>
          <ul className="guide-sections">
            {described.map((s) => (
              <li key={s.key}>
                <Link href={sectionHref(locale, s)}>
                  <span className="guide-tag">{tn(s.key)}</span>
                  <span className="guide-desc">{t(`section.${s.key}`, counts)}</span>
                  <span className="guide-tip">{t(`tip.${s.key}`, counts)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="guide-block">
          <h3>{t('logbookTitle')}</h3>
          <p className="guide-p">{t('logbookBody', counts)}</p>
          {started && (
            <p className="guide-progress">
              {t('yourProgress', {
                planes: stats.planes,
                badges: Object.keys(book.badges).length,
                total: counts.badges,
              })}
            </p>
          )}
          <ul className="guide-list">
            <li><span>{t('badgeTip1')}</span></li>
            <li><span>{t('badgeTip2')}</span></li>
            <li><span>{t('badgeTip3')}</span></li>
          </ul>
        </section>

        <section className="guide-block">
          <h3>{t('knowTitle')}</h3>
          <div className="guide-note">
            <p>{t('privacy')}</p>
            <p className="dim">{t('quietSky')}</p>
          </div>
        </section>

        <p className="page-note">{t('freshness')}</p>
      </main>
    </div>
  );
}
