import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CatalogClient } from '@/components/product/CatalogClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Catalog' });
  return { title: t('title'), description: t('metaDescription') };
}

export default async function CatalogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Catalog');

  return (
    <div className="max-w-container px-lg mx-auto pt-[60px]">
      <h1 className="mb-lg text-h1 text-center text-neutral-900 uppercase">{t('title')}</h1>
      {/* useSearchParams в CatalogClient требует Suspense-границу — тот же паттерн, что у Header
          в app/[locale]/(storefront)/layout.tsx. */}
      <Suspense fallback={<div className="h-[60vh]" />}>
        <CatalogClient />
      </Suspense>
    </div>
  );
}
