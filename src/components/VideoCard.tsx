'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export interface VideoCardProps {
  /** YouTube video id. */
  id: string;
  title: string;
  channel: string;
  /** Small badge above the title, already translated. */
  kindLabel: string;
  /** Renders the card larger, for a page's headline video. */
  featured?: boolean;
}

/**
 * A YouTube video, loaded only when asked for.
 *
 * No iframe exists until the child presses play, so the page sets no YouTube
 * cookie on its own; the still image does come from YouTube's image server and
 * the page says so. Whether a channel permits third-party embedding cannot be
 * detected in advance, so the direct link is always present and the "not
 * playing?" line appears the moment play is pressed — a blocked video then
 * leads somewhere useful instead of showing a dead grey box.
 */
export default function VideoCard({ id, title, channel, kindLabel, featured }: VideoCardProps) {
  const t = useTranslations('video');
  const [playing, setPlaying] = useState(false);

  return (
    <div className={`video-card${featured ? ' featured' : ''}`}>
      <div className="video-frame">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <button className="video-facade" onClick={() => setPlaying(true)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" />
            <span className="video-play" aria-hidden="true">▶</span>
            <span className="sr-only">{t('play', { title })}</span>
          </button>
        )}
      </div>

      <div className="video-meta">
        {playing && (
          <p className="video-fallback">
            {t('notPlaying')}{' '}
            <a
              href={`https://www.youtube.com/watch?v=${id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('openOnYouTube')}
            </a>
          </p>
        )}
        <span className="video-kind">{kindLabel}</span>
        <p className="video-title">{title}</p>
        <p className="video-channel">
          {channel} ·{' '}
          <a
            href={`https://www.youtube.com/watch?v=${id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('openOnYouTube')}
          </a>
        </p>
      </div>
    </div>
  );
}
