'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import SiteNav from './SiteNav';
import Quiz from './Quiz';
import LiftLab from './LiftLab';
import { useLogbook } from './LogbookProvider';
import { learnCard, learnCards } from '@/lib/learn';

const INTERACTIVES: Record<string, () => React.ReactElement> = {
  'lift-lab': () => <LiftLab />,
};

export default function LearnCardView({ cardId }: { cardId: string }) {
  const t = useTranslations('learn');
  const locale = useLocale();
  const { book, submitQuiz } = useLogbook();

  const card = learnCard(locale, cardId);
  if (!card) {
    return (
      <div className="page">
        <SiteNav />
        <main className="page-body">
          <h2 className="page-title">{t('missing')}</h2>
          <Link className="back-link" href={`/${locale}/learn`}>
            ← {t('backToList')}
          </Link>
        </main>
      </div>
    );
  }

  const all = learnCards(locale);
  const idx = all.findIndex((c) => c.id === cardId);
  const next = all[idx + 1];
  const Interactive = card.interactive ? INTERACTIVES[card.interactive] : undefined;
  const best = book.quizzes[card.id]?.best;

  return (
    <div className="page">
      <SiteNav />
      <main className="page-body article">
        <Link className="back-link" href={`/${locale}/learn`}>
          ← {t('backToList')}
        </Link>

        <p className="article-topic">{card.topic}</p>
        <h2 className="page-title">{card.title}</h2>
        <p className="article-hero">{card.hero}</p>

        {card.body.map((p, i) => (
          <p key={i} className="article-p">{p}</p>
        ))}

        {Interactive && (
          <section className="article-interactive">
            <Interactive />
          </section>
        )}

        <ul className="article-bullets">
          {card.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>

        <section className="article-quiz">
          <h3>{t('quizTitle')}</h3>
          <Quiz
            cardId={card.id}
            questions={card.quiz}
            previousBest={best}
            onFinish={(correct, total) => submitQuiz(card.id, correct, total)}
          />
        </section>

        {next && (
          <Link className="next-card" href={`/${locale}/learn/${next.id}`}>
            {t('nextCard')} · {next.title} →
          </Link>
        )}
      </main>
    </div>
  );
}
