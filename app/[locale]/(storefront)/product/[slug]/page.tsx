import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductDetailClient } from '@/components/product/ProductDetailClient';
import { ProductCard } from '@/components/product/ProductCard';
import { MOCK_CATEGORIES, MOCK_PRODUCTS, getMockRelatedProducts } from '@/components/product/mock-data';

export function generateStaticParams() {
  return MOCK_PRODUCTS.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  const product = MOCK_PRODUCTS.find((p) => p.slug === slug);
  if (!product) return {};

  return {
    title: product.name,
    description: product.description,
    openGraph: { images: [product.images[0]!] },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const product = MOCK_PRODUCTS.find((p) => p.slug === slug);
  if (!product) notFound();

  const category = MOCK_CATEGORIES.find((c) => c.id === product.categoryId);
  const categoryLabel = category ? (locale === 'de' ? category.nameDe : category.nameEn) : '';

  const tCatalog = await getTranslations('Catalog');
  const tProduct = await getTranslations('Product');
  const tProductPage = await getTranslations('ProductPage');
  const ageGroupLabel = tCatalog(`ageGroups.${product.ageGroup}`);
  const related = getMockRelatedProducts(product);

  return (
    <div className="mx-auto max-w-container px-lg pt-[60px]">
      <div className="grid grid-cols-1 gap-xl sm:grid-cols-2">
        <ProductGallery images={product.images} alt={product.name} />
        <ProductDetailClient product={product} categoryLabel={categoryLabel} ageGroupLabel={ageGroupLabel} />
      </div>

      {/* design.md → Components «You may also like»: не рендерится вовсе, если подходящих
          товаров не нашлось — не показывать пустую сетку с одним заголовком. */}
      {related.length > 0 && (
        <div className="mt-[60px] flex flex-col gap-lg">
          <h2 className="text-h3 text-neutral-900">{tProductPage('relatedTitle')}</h2>
          {/* Та же зафиксированная ширина карточки, что в CatalogClient.tsx — design.md → Layout. */}
          <div className="grid grid-cols-1 justify-items-center justify-center gap-gutter sm:grid-cols-[repeat(2,minmax(0,290px))] lg:grid-cols-3 xl:grid-cols-4">
            {related.map((relatedProduct) => (
              <div key={relatedProduct.id} className="w-full max-w-[290px]">
                <ProductCard
                  product={relatedProduct}
                  locale={locale}
                  newLabel={tProduct('newBadge')}
                  addToCartLabel={tProduct('addToCart', { name: relatedProduct.name })}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
