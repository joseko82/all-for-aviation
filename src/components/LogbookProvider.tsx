'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocale } from 'next-intl';
import BadgeToast from './BadgeToast';
import LogbookPanel from './LogbookPanel';
import { evaluateBadges } from '@/lib/badges';
import {
  computeStats,
  emptyLogbook,
  load as loadLogbook,
  recordQuiz,
  recordSighting,
  recordVisit,
  save as saveLogbook,
  type Logbook,
  type Stats,
} from '@/lib/logbook';
import { localeUnits, type Locale } from '@/i18n/routing';
import type { Aircraft } from '@/lib/types';

interface LogbookContextValue {
  book: Logbook;
  stats: Stats;
  /** True once localStorage has been read; guards against SSR/hydration flicker. */
  ready: boolean;
  spot: (aircraft: Aircraft) => void;
  submitQuiz: (cardId: string, correct: number, total: number) => void;
  reset: () => void;
  openPanel: () => void;
}

const LogbookContext = createContext<LogbookContextValue | null>(null);

/**
 * Holds the logbook for the whole site.
 *
 * The map records sightings, the learning pages record quiz results, and both
 * feed the same badge list — so the state has to live above all of them rather
 * than inside the map component.
 */
export default function LogbookProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale() as Locale;
  const units = localeUnits[locale] ?? 'imperial';

  const [book, setBook] = useState<Logbook>(emptyLogbook);
  const [ready, setReady] = useState(false);
  const [stats, setStats] = useState<Stats>(() => computeStats(emptyLogbook()));
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    setBook(recordVisit(loadLogbook()));
    setReady(true);
  }, []);

  // Recompute stats and award badges whenever the book changes. Awarding
  // rewrites the book, which re-runs this effect once more and then settles.
  useEffect(() => {
    if (!ready) return;
    const s = computeStats(book);
    setStats(s);
    const { book: awarded, newlyEarned } = evaluateBadges(book, s);
    if (newlyEarned.length > 0) {
      setNewBadges((prev) => [...prev, ...newlyEarned]);
      setBook(awarded);
      return;
    }
    saveLogbook(awarded);
  }, [book, ready]);

  const spot = useCallback((aircraft: Aircraft) => {
    setBook((prev) => recordSighting(prev, aircraft));
  }, []);

  const submitQuiz = useCallback((cardId: string, correct: number, total: number) => {
    setBook((prev) => recordQuiz(prev, cardId, correct, total));
  }, []);

  const reset = useCallback(() => {
    const fresh = recordVisit(emptyLogbook());
    setBook(fresh);
    saveLogbook(fresh);
    setNewBadges([]);
  }, []);

  const openPanel = useCallback(() => setPanelOpen(true), []);

  const value = useMemo<LogbookContextValue>(
    () => ({ book, stats, ready, spot, submitQuiz, reset, openPanel }),
    [book, stats, ready, spot, submitQuiz, reset, openPanel],
  );

  return (
    <LogbookContext.Provider value={value}>
      {children}
      <BadgeToast badgeIds={newBadges} onDismiss={() => setNewBadges([])} />
      {panelOpen && (
        <LogbookPanel
          book={book}
          stats={stats}
          units={units}
          locale={locale}
          onClose={() => setPanelOpen(false)}
          onReset={reset}
        />
      )}
    </LogbookContext.Provider>
  );
}

export function useLogbook(): LogbookContextValue {
  const ctx = useContext(LogbookContext);
  if (!ctx) throw new Error('useLogbook must be used inside <LogbookProvider>');
  return ctx;
}
