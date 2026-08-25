import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CatalogClient } from '@/components/product/CatalogClient';
import { getCategories } from '@/lib/db/queries/products.queries';
import { STOREFRONT_PAGE_CONTAINER_CLASSNAME } from '@/components/layout/page-styles';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Catalog' });
  return { title: t('title'), description: t('metaDescription') };
}

export default async function CatalogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Catalog');
  const categories = await getCategories();

  return (
    <div className={STOREFRONT_PAGE_CONTAINER_CLASSNAME}>
      {/* text-[30px] поверх text-h1 (32px) и mb-xl (40px) вместо mb-lg (24px) — по прямому
          запросу; line-height/font-weight остаются от h1 (1.2/700). */}
      <h1 className="mb-xl text-h1 text-center text-[30px] text-neutral-900 uppercase">
        {t('title')}
      </h1>
      {/* useSearchParams в CatalogClient требует Suspense-границу — тот же паттерн, что у Header
          в app/[locale]/(storefront)/layout.tsx. */}
      <Suspense fallback={<div className="h-[60vh]" />}>
        <CatalogClient categories={categories} />
      </Suspense>
    </div>
  );
}
