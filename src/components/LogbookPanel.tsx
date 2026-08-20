'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { AIRLINES, flagEmoji } from '@/lib/airlines';
import { BADGES } from '@/lib/badges';
import type { Logbook, Stats } from '@/lib/logbook';
import { typeName } from '@/lib/aircraft';
import { formatAltitude, formatSpeed, type UnitSystem } from '@/lib/format';

interface Props {
  book: Logbook;
  stats: Stats;
  units: UnitSystem;
  locale: string;
  onClose: () => void;
  onReset: () => void;
}

export default function LogbookPanel({ book, stats, units, locale, onClose, onReset }: Props) {
  const t = useTranslations('logbook');
  const tb = useTranslations('badges');

  const recent = useMemo(
    () => Object.values(book.sightings).sort((a, b) => b.last - a.last).slice(0, 25),
    [book.sightings],
  );

  const earnedCount = BADGES.filter((b) => book.badges[b.id]).length;
  const timeFmt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="logbook-scrim" role="dialog" aria-modal="true" aria-label={t('title')}>
      <aside className="logbook">
        <header className="logbook-head">
          <h2>{t('title')}</h2>
          <button className="panel-close" onClick={onClose} aria-label={t('close')}>
            ×
          </button>
        </header>

        {stats.planes === 0 && stats.cardsTried === 0 ? (
          <div className="logbook-empty">
            <p>{t('empty')}</p>
            <p className="dim">{t('emptyHint')}</p>
          </div>
        ) : (
          <dl className="logbook-stats">
            <div><dt>{t('statPlanes')}</dt><dd>{stats.planes}</dd></div>
            <div><dt>{t('statTypes')}</dt><dd>{stats.types.length}</dd></div>
            <div><dt>{t('statAirlines')}</dt><dd>{stats.airlines.length}</dd></div>
            <div><dt>{t('statCountries')}</dt><dd>{stats.countries.length}</dd></div>
            <div><dt>{t('statStreak')}</dt><dd>{stats.streak}</dd></div>
            <div><dt>{t('statCards')}</dt><dd>{stats.cardsPassed}</dd></div>
            <div>
              <dt>{t('statHighest')}</dt>
              <dd className="small">{formatAltitude(stats.highestAlt, units, locale)}</dd>
            </div>
            <div>
              <dt>{t('statFastest')}</dt>
              <dd className="small">{formatSpeed(stats.fastest, units, locale)}</dd>
            </div>
          </dl>
        )}

        <section className="logbook-section">
          <h3>
            {t('badgesTitle')}
            <span className="dim">
              {' '}
              {t('badgesEarned', { earned: earnedCount, total: BADGES.length })}
            </span>
          </h3>
          <ul className="badge-grid">
            {BADGES.map((b) => {
              const earned = Boolean(book.badges[b.id]);
              const pct = earned ? 1 : (b.progress?.(stats, book) ?? 0);
              return (
                <li
                  key={b.id}
                  className={`badge ${earned ? `earned ${b.tier}` : 'locked'}`}
                  title={earned ? tb(`${b.id}.name`) : `${t('locked')} — ${tb(`${b.id}.hint`)}`}
                >
                  <span className="badge-symbol" aria-hidden="true">{b.symbol}</span>
                  <span className="badge-name">{tb(`${b.id}.name`)}</span>
                  <span className="badge-hint">{tb(`${b.id}.hint`)}</span>
                  {!earned && pct > 0 && (
                    <span className="badge-progress">
                      <span style={{ inlineSize: `${Math.round(pct * 100)}%` }} />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {recent.length > 0 && (
          <section className="logbook-section">
            <h3>{t('recentTitle')}</h3>
            <ul className="sighting-list">
              {recent.map((s) => {
                const airline = s.airline ? AIRLINES[s.airline] : undefined;
                return (
                  <li key={s.id}>
                    <div className="sighting-main">
                      <span className="sighting-cs">{s.cs || s.reg || s.id.toUpperCase()}</span>
                      <span className="sighting-type">{typeName(s.type) ?? s.type}</span>
                    </div>
                    <div className="sighting-meta">
                      <span>
                        {airline
                          ? `${flagEmoji(airline.country)} ${airline.name}`
                          : (s.airline ?? '')}
                      </span>
                      <span className="dim">
                        {s.reg ? `${s.reg} · ` : ''}
                        {timeFmt.format(s.last)}
                        {s.count > 1 ? ` · ${t('seenTimes', { count: s.count })}` : ''}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <footer className="logbook-foot">
          <p className="dim">{t('privacyNote')}</p>
          {(stats.planes > 0 || stats.cardsTried > 0) && (
            <button className="danger" onClick={onReset}>
              {t('reset')}
            </button>
          )}
        </footer>
      </aside>
    </div>
  );
}
