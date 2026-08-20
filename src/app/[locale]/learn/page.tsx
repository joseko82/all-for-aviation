import { setRequestLocale } from 'next-intl/server';
import LearnIndex from '@/components/LearnIndex';

export default async function LearnPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LearnIndex />;
}
