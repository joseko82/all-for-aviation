import { setRequestLocale } from 'next-intl/server';
import AirportVideos from '@/components/AirportVideos';

export default async function AirportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AirportVideos />;
}
