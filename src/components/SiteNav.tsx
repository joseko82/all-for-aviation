'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useLogbook } from './LogbookProvider';

/** Shared header: brand, section links, and the logbook button. */
export default function SiteNav({ children }: { children?: React.ReactNode }) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { stats, openPanel } = useLogbook();

  const sections = [
    { href: `/${locale}`, label: t('nav.map'), match: (p: string) => p === `/${locale}` },
    {
      href: `/${locale}/compare`,
      label: t('nav.compare'),
      match: (p: string) => p.startsWith(`/${locale}/compare`),
    },
    {
      href: `/${locale}/learn`,
      label: t('nav.learn'),
      match: (p: string) => p.startsWith(`/${locale}/learn`),
    },
    {
      href: `/${locale}/game`,
      label: t('nav.game'),
      match: (p: string) => p.startsWith(`/${locale}/game`),
    },
  ];

  return (
    <header className="header">
      <div className="brand">
        <Link href={`/${locale}`}>
          <h1>{t('meta.title')}</h1>
        </Link>
      </div>

      <nav className="sections" aria-label={t('nav.sections')}>
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={s.match(pathname) ? 'active' : ''}
            aria-current={s.match(pathname) ? 'page' : undefined}
          >
            {s.label}
          </Link>
        ))}
      </nav>

      <button className="logbook-btn" onClick={openPanel} aria-haspopup="dialog">
        {t('logbook.open')}
        {stats.planes + stats.cardsTried > 0 && (
          <span className="count">{stats.planes}</span>
        )}
      </button>

      {children}
    </header>
  );
}
