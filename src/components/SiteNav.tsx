'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useLogbook } from './LogbookProvider';
import { SECTIONS, sectionHref, isActive } from '@/lib/sections';

/** Shared header: brand, section links, and the logbook button. */
export default function SiteNav({ children }: { children?: React.ReactNode }) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { stats, openPanel } = useLogbook();

  const sections = SECTIONS.filter((x) => x.inNav);

  return (
    <header className="header">
      <div className="brand">
        <Link href={`/${locale}`}>
          <h1>{t('meta.title')}</h1>
        </Link>
      </div>

      <nav className="sections" aria-label={t('nav.sections')}>
        {sections.map((s) => {
          const active = isActive(pathname, locale, s);
          return (
            <Link
              key={s.key}
              href={sectionHref(locale, s)}
              className={active ? 'active' : ''}
              aria-current={active ? 'page' : undefined}
            >
              {t(`nav.${s.key}`)}
            </Link>
          );
        })}
      </nav>

      <Link
        href={`/${locale}/guide`}
        className={`guide-btn${pathname.startsWith(`/${locale}/guide`) ? ' active' : ''}`}
        aria-current={pathname.startsWith(`/${locale}/guide`) ? 'page' : undefined}
      >
        <span aria-hidden="true">?</span>
        {t('nav.guide')}
      </Link>

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
