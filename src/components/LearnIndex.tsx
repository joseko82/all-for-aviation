'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import SiteNav from './SiteNav';
import { useLogbook } from './LogbookProvider';
import { learnCards } from '@/lib/learn';

export default function LearnIndex() {
  const t = useTranslations('learn');
  const locale = useLocale();
  const { book } = useLogbook();
  const cards = learnCards(locale);

  const topics = [...new Set(cards.map((c) => c.topic))];
  const passed = cards.filter((c) => {
    const r = book.quizzes[c.id];
    return r && r.best >= r.total;
  }).length;

  return (
    <div className="page">
      <SiteNav />
      <main className="page-body">
        <h2 className="page-title">{t('title')}</h2>
        <p className="page-lede">{t('lede')}</p>
        <p className="learn-progress">
          {t('passedCount', { passed, total: cards.length })}
        </p>

        {topics.map((topic) => (
          <section key={topic} className="learn-topic">
            <h3>{topic}</h3>
            <ul className="learn-grid">
              {cards
                .filter((c) => c.topic === topic)
                .map((c) => {
                  const r = book.quizzes[c.id];
                  const state = !r ? 'new' : r.best >= r.total ? 'passed' : 'tried';
                  return (
                    <li key={c.id} className={`learn-card-link ${state}`}>
                      <Link href={`/${locale}/learn/${c.id}`}>
                        <span className="learn-card-title">{c.title}</span>
                        <span className="learn-card-teaser">{c.teaser}</span>
                        <span className="learn-card-state">
                          {state === 'passed'
                            ? t('statePassed')
                            : state === 'tried'
                              ? t('stateTried', { best: r!.best, total: r!.total })
                              : t('stateNew')}
                        </span>
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
