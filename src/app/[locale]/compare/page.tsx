import { setRequestLocale } from 'next-intl/server';
import SizeCompare from '@/components/SizeCompare';

export default async function ComparePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SizeCompare />;
}
