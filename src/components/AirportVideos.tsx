'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import SiteNav from './SiteNav';
import { AIRPORT_VIDEOS, videosFor, type AirportVideo } from '@/lib/airportVideos';
import { HUBS } from '@/lib/hubs';

/**
 * Click-to-play video card.
 *
 * Nothing from YouTube is requested until the child presses play — no iframe,
 * no script, no cookie. The thumbnail is a single static image, and the player
 * that replaces it uses youtube-nocookie.com. The "open on YouTube" link is
 * always visible so that a video whose owner has disabled embedding still
 * leads somewhere useful instead of showing a dead grey box.
 */
function VideoCard({ video }: { video: AirportVideo }) {
  const t = useTranslations('airports');
  const [playing, setPlaying] = useState(false);

  return (
    <li className="video-card">
      <div className="video-frame">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <button className="video-facade" onClick={() => setPlaying(true)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
              alt=""
              loading="lazy"
            />
            <span className="video-play" aria-hidden="true">▶</span>
            <span className="sr-only">{t('play', { title: video.title })}</span>
          </button>
        )}
      </div>
      <div className="video-meta">
        <span className={`video-kind ${video.kind}`}>{t(`kind.${video.kind}`)}</span>
        <p className="video-title">{video.title}</p>
        <p className="video-channel">
          {video.channel} ·{' '}
          <a
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('openOnYouTube')}
          </a>
        </p>
      </div>
    </li>
  );
}

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
            <VideoCard key={v.id} video={v} />
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
