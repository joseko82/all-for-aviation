'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import SiteNav from './SiteNav';
import VideoCard from './VideoCard';
import { AIRPORT_VIDEOS, videosFor } from '@/lib/airportVideos';
import { HUBS } from '@/lib/hubs';

export default function AirportVideos() {
  const t = useTranslations('airports');
  const locale = useLocale();

  const airports = HUBS.filter((h) => AIRPORT_VIDEOS[h.icao]);
  const [selected, setSelected] = useState(airports[0]?.icao ?? 'RKSI');

  const hub = airports.find((h) => h.icao === selected) ?? airports[0];
  const videos = videosFor(selected);

  return (
    <div className="page">
      <SiteNav />
      <main className="page-body">
        <h2 className="page-title">{t('title')}</h2>
        <p className="page-lede">{t('lede')}</p>

        <nav className="airport-picker" aria-label={t('pick')}>
          {airports.map((h) => (
            <button
              key={h.icao}
              className={`hub ${h.icao === selected ? 'active' : ''}`}
              onClick={() => setSelected(h.icao)}
              aria-current={h.icao === selected ? 'true' : undefined}
            >
              <span className="iata">{h.iata}</span>
              <span className="city">{h.city}</span>
            </button>
          ))}
        </nav>

        {hub && (
          <p className="airport-heading">
            {t('nowShowing', { city: hub.city, iata: hub.iata, icao: hub.icao })}
          </p>
        )}

        <ul className="video-grid">
          {videos.map((v) => (
            <li key={v.id}>
              <VideoCard
                id={v.id}
                title={v.title}
                channel={v.channel}
                kindLabel={t(`kind.${v.kind}`)}
              />
            </li>
          ))}
        </ul>

        <p className="page-note">{t('privacyNote')}</p>
        <p className="page-note">{t('creditNote')}</p>
        <p className="page-note">
          <a className="back-link" href={`/${locale}`}>← {t('backToMap')}</a>
        </p>
      </main>
    </div>
  );
}
