import { setRequestLocale } from 'next-intl/server';
import { UiPlaygroundClient } from './UiPlaygroundClient';

export default async function UiPlaygroundPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <UiPlaygroundClient />;
}
