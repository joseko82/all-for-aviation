import { setRequestLocale } from 'next-intl/server';
import LiveMap from '@/components/LiveMap';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LiveMap />;
}
