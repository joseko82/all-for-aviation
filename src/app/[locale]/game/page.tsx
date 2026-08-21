import { setRequestLocale } from 'next-intl/server';
import GameBoard from '@/components/GameBoard';

export default async function GamePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <GameBoard />;
}
