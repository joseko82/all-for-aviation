import { setRequestLocale } from 'next-intl/server';
import LearnCardView from '@/components/LearnCardView';
import { learnCards } from '@/lib/learn';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    learnCards(locale).map((c) => ({ locale, card: c.id })),
  );
}

export default async function LearnCardPage({
  params,
}: {
  params: Promise<{ locale: string; card: string }>;
}) {
  const { locale, card } = await params;
  setRequestLocale(locale);
  return <LearnCardView cardId={card} />;
}
