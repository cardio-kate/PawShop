import type { MetadataRoute } from 'next';
import { getProducts } from '@/lib/db/queries/products.queries';
import { getSiteUrl } from '@/lib/utils';
import { routing } from '@/i18n/routing';

// i18n/routing.ts не задаёт localePrefix — next-intl использует дефолт 'always': ни один маршрут
// витрины не существует без префикса локали (app/[locale]/(storefront)/**), поэтому URL строятся
// вручную с префиксом на каждый локаль, не полагаясь на generateStaticParams/другой механизм.
const SITE_URL = getSiteUrl();

// Только реальные SEO-значимые публичные маршруты витрины — не /checkout (форма оформления заказа,
// нет контента для индексации), не /nine-lives|/staff-entry|/*/ui-playground (app/robots.ts уже их
// исключает из индексации).
const STATIC_ENTRIES: { path: string; changeFrequency: 'daily' | 'weekly' | 'monthly' }[] = [
  { path: '', changeFrequency: 'weekly' },
  { path: '/catalog', changeFrequency: 'daily' },
  { path: '/delivery', changeFrequency: 'monthly' },
  { path: '/contact', changeFrequency: 'monthly' },
  { path: '/privacy-policy', changeFrequency: 'monthly' },
  { path: '/impressum', changeFrequency: 'monthly' },
];

function localizedEntry(path: string) {
  return {
    url: `${SITE_URL}/${routing.defaultLocale}${path}`,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((locale) => [locale, `${SITE_URL}/${locale}${path}`]),
      ),
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Та же query, что и страница каталога (CLAUDE.md → «Кэш и SEO»), без search/фильтров — locale не
  // влияет на набор строк (только на то, что не запрошено, см. buildProductConditions в
  // products.queries.ts). limit 1000 — разово, без пагинации, с запасом под реальный масштаб
  // нишевого магазина, не бесконечный список.
  const { products } = await getProducts({ locale: routing.defaultLocale, limit: 1000 });

  return [
    ...STATIC_ENTRIES.map(({ path, changeFrequency }) => ({
      ...localizedEntry(path),
      changeFrequency,
    })),
    ...products.map((product) => ({
      ...localizedEntry(`/product/${product.slug}`),
      lastModified: product.createdAt,
      changeFrequency: 'weekly' as const,
    })),
  ];
}
