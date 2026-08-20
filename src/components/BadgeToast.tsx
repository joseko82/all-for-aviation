'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { BADGES } from '@/lib/badges';

interface Props {
  badgeIds: string[];
  onDismiss: () => void;
}

/** Celebrates newly-earned badges, then gets out of the way. */
export default function BadgeToast({ badgeIds, onDismiss }: Props) {
  const t = useTranslations('badges');

  useEffect(() => {
    if (badgeIds.length === 0) return;
    const timer = setTimeout(onDismiss, 5200);
    return () => clearTimeout(timer);
  }, [badgeIds, onDismiss]);

  if (badgeIds.length === 0) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {badgeIds.map((id) => {
        const def = BADGES.find((b) => b.id === id);
        if (!def) return null;
        return (
          <button key={id} className={`toast ${def.tier}`} onClick={onDismiss}>
            <span className="toast-symbol" aria-hidden="true">{def.symbol}</span>
            <span className="toast-text">
              <strong>{t('newBadge')}</strong>
              <span>{t(`${id}.name`)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
