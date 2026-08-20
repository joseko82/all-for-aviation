'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { QuizQuestion } from '@/lib/learn';

interface Props {
  cardId: string;
  questions: QuizQuestion[];
  /** Best score already recorded for this card, if any. */
  previousBest?: number;
  onFinish: (correct: number, total: number) => void;
}

export default function Quiz({ cardId, questions, previousBest, onFinish }: Props) {
  const t = useTranslations('quiz');
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[index];
  const total = questions.length;

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) setCorrect((c) => c + 1);
  };

  const next = () => {
    const isLast = index === total - 1;
    if (isLast) {
      setDone(true);
      // `correct` is already up to date: choose() ran in an earlier event.
      onFinish(correct, total);
      return;
    }
    setIndex((n) => n + 1);
    setPicked(null);
  };

  const restart = () => {
    setIndex(0);
    setPicked(null);
    setCorrect(0);
    setDone(false);
  };

  if (done) {
    const perfect = correct === total;
    return (
      <div className="quiz quiz-done">
        <p className={`quiz-score ${perfect ? 'perfect' : ''}`}>
          {t('score', { correct, total })}
        </p>
        <p className="quiz-verdict">{perfect ? t('perfect') : t('tryAgainHint')}</p>
        {previousBest !== undefined && previousBest > correct && (
          <p className="dim">{t('bestKept', { best: previousBest })}</p>
        )}
        <button onClick={restart}>{t('again')}</button>
      </div>
    );
  }

  return (
    <div className="quiz">
      <p className="quiz-progress">{t('progress', { index: index + 1, total })}</p>
      <p className="quiz-q">{q.q}</p>
      <ul className="quiz-options">
        {q.options.map((opt, i) => {
          const state =
            picked === null
              ? ''
              : i === q.answer
                ? 'right'
                : i === picked
                  ? 'wrong'
                  : 'muted';
          return (
            <li key={`${cardId}-${index}-${i}`}>
              <button className={state} onClick={() => choose(i)} disabled={picked !== null}>
                {opt}
              </button>
            </li>
          );
        })}
      </ul>
      {picked !== null && (
        <div className="quiz-why">
          <p>{q.why}</p>
          <button className="primary" onClick={next}>
            {index === total - 1 ? t('finish') : t('next')}
          </button>
        </div>
      )}
    </div>
  );
}
