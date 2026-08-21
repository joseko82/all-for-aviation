import { setRequestLocale } from 'next-intl/server';
import FunPage from '@/components/FunPage';

export default async function Fun({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <FunPage />;
}
