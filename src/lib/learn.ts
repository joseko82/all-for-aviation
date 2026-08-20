import en from '../../content/learn/en.json';

/**
 * Learning content.
 *
 * Deliberately kept out of `messages/*.json`. UI strings and article text get
 * translated by different people at different times — a button label is a
 * mechanical translation, but an explanation aimed at a 12-year-old has to be
 * rewritten, not translated. Keeping them apart means that split costs nothing
 * later.
 */

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

export interface LearnCard {
  id: string;
  topic: string;
  title: string;
  teaser: string;
  hero: string;
  body: string[];
  bullets: string[];
  /** Key of an interactive widget to embed, if any. */
  interactive: string | null;
  quiz: QuizQuestion[];
}

const BY_LOCALE: Record<string, { cards: LearnCard[] }> = {
  en: en as { cards: LearnCard[] },
};

export function learnCards(locale: string): LearnCard[] {
  return (BY_LOCALE[locale] ?? BY_LOCALE.en).cards;
}

export function learnCard(locale: string, id: string): LearnCard | undefined {
  return learnCards(locale).find((c) => c.id === id);
}

/** Used by the badge rules, which must not depend on the active locale. */
export const TOTAL_LEARN_CARDS = (BY_LOCALE.en.cards as LearnCard[]).length;
