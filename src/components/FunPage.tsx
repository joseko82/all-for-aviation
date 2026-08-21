'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import SiteNav from './SiteNav';
import VideoCard from './VideoCard';
import { CYCLE_DAYS, dayNumber, memeForDay, recentMemes, type Meme } from '@/lib/memes';

/**
 * A different aviation video every day.
 *
 * The day is worked out on the client, from the viewer's own clock, so the
 * video changes at his midnight rather than the server's. That also means the
 * first paint has no video: rendering a server-side guess and then swapping it
 * would flash the wrong clip for anyone east or west of the build machine.
 */
export default function FunPage() {
  const t = useTranslations('fun');
  const locale = useLocale();

  const [day, setDay] = useState<number | null>(null);
  useEffect(() => setDay(dayNumber()), []);

  const today: Meme | null = day === null ? null : memeForDay(day);
  const earlier: Meme[] = day === null ? [] : recentMemes(day, 3);
  const dateLabel =
    day === null
      ? ''
      : new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' })
          .format(new Date());

  return (
    <div className="page">
      <SiteNav />
      <main className="page-body">
        <h2 className="page-title">{t('title')}</h2>
        <p className="page-lede">{t('lede', { days: CYCLE_DAYS })}</p>

        {today ? (
          <>
            <p className="fun-date">{dateLabel}</p>
            <VideoCard
              id={today.id}
              title={today.title}
              channel={today.channel}
              kindLabel={t(`kind.${today.kind}`)}
              featured
            />

            <section className="fun-earlier">
              <h3>{t('earlierTitle')}</h3>
              <ul className="video-grid">
                {earlier.map((m, i) => (
                  <li key={`${m.id}-${i}`}>
                    <VideoCard
                      id={m.id}
                      title={m.title}
                      channel={m.channel}
                      kindLabel={t(`kind.${m.kind}`)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : (
          <p className="fun-loading">{t('loading')}</p>
        )}

        <p className="page-note">{t('curationNote')}</p>
        <p className="page-note">{t('creditNote')}</p>
      </main>
    </div>
  );
}
