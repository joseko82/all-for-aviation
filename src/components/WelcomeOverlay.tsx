'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

/**
 * Shown once, ever.
 *
 * Not on every visit: this site's whole loop is open → see aeroplanes → tap →
 * badge, and putting a document in front of that is help on day one and an
 * obstacle from day two. But the dedication deserves to be seen rather than
 * buried behind a nav item, and a first visit is the one moment where an
 * interstitial is the right answer.
 *
 * The map keeps loading behind it, so dismissing lands straight in the product.
 */
export default function WelcomeOverlay({ onStart }: { onStart: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const startRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    startRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onStart();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStart]);

  return (
    <div className="welcome-scrim" role="dialog" aria-modal="true" aria-labelledby="welcome-name">
      <div className="welcome">
        <p className="welcome-lead">{t('guide.dedicationLead')}</p>
        <p className="welcome-name" id="welcome-name">{t('guide.dedicationName')}</p>
        <p className="welcome-tail">{t('guide.dedicationTail')}</p>

        <ol className="welcome-steps">
          <li><span>{t('guide.step1')}</span></li>
          <li><span>{t('guide.step2')}</span></li>
          <li><span>{t('guide.step3')}</span></li>
        </ol>

        <div className="welcome-actions">
          <button ref={startRef} className="welcome-start" onClick={onStart}>
            {t('welcome.start')}
          </button>
          <Link className="welcome-more" href={`/${locale}/guide`} onClick={onStart}>
            {t('welcome.readMore')}
          </Link>
        </div>

        <p className="welcome-note">{t('welcome.onceOnly')}</p>
      </div>
    </div>
  );
}
