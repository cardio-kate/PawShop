import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductDetailClient } from '@/components/product/ProductDetailClient';
import { ProductCard } from '@/components/product/ProductCard';
import { MOCK_CATEGORIES, MOCK_PRODUCTS, getMockRelatedProducts } from '@/components/product/mock-data';
import { getProductGridColumnsClassName } from '@/components/product/getProductGridColumnsClassName';

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
      {/* Колонка галереи — clamp(…,50vw,450px), не фиксированные 450px: на bp-sm..~1024px
          450px съедал бы почти всю ширину экрана, оставляя тексту только свой min-content
          (кнопка Add to Cart, см. ProductDetailClient.tsx) — колонки визуально «расходились»,
          картинка сжималась гораздо резче текста. clamp растит галерею и кнопку по одной вёрстке
          (40vw для кнопки, вдвое меньше 50vw для галереи — та же пропорция 294/450 ≈ 0.65, что и
          у верхних потолков). Gap — тем же приёмом: gap-xl (40px) только до bp-sm (вертикальный
          зазор между фото и текстом в один столбец), с bp-sm — clamp сжимается до 16px и
          восстанавливается до gap-xl к тому же ~1024px, где галерея и кнопка достигают потолка. */}
      <div className="grid grid-cols-1 gap-xl sm:grid-cols-[clamp(240px,calc(50vw_-_60px),450px)_1fr] sm:gap-[clamp(16px,calc(6vw_-_22px),40px)]">
        <ProductGallery images={product.images} alt={product.name} />
        <ProductDetailClient product={product} categoryLabel={categoryLabel} ageGroupLabel={ageGroupLabel} />
      </div>

      {/* design.md → Components «You may also like»: не рендерится вовсе, если подходящих
          товаров не нашлось — не показывать пустую сетку с одним заголовком. */}
      {related.length > 0 && (
        <div className="mt-[60px] flex flex-col gap-lg">
          <h2 className="text-center text-section-heading uppercase text-neutral-900">{tProductPage('relatedTitle')}</h2>
          {/* Та же зафиксированная ширина карточки, что в CatalogClient.tsx — design.md → Layout.
              Число колонок ограничено числом реальных карточек (getProductGridColumnsClassName) —
              «You may also like» почти никогда не набирает все 4 совпадения по ageGroup, а лишние
              колонки без карточки внутри всё равно резервируют себе полную ширину track'а.
              Осознанное отклонение именно для этого блока (не для /catalog, там design.md прямо
              требует center и для этого случая тоже): на mobile/tablet (< bp-lg) — по центру, на
              desktop (≥ bp-lg) — прижато к левому краю, вровень с колонками страницы товара выше
              (заголовок над сеткой при этом центрирован отдельно — то же расхождение, что у
              «New Arrivals» на главной, где подпись под секцией центрируется, а сетка карточек
              под ней — нет). justify-items-start/justify-start нужны оба — justify-items решает
              позицию при единственной карточке (grid-cols-1, одна на всю ширину track'а),
              justify-content — при 2+ карточках (несколько узких track'ов внутри широкого
              контейнера). */}
          <div
            className={`grid justify-items-center justify-center gap-gutter lg:justify-items-start lg:justify-start ${getProductGridColumnsClassName(related.length)}`}
          >
            {related.map((relatedProduct) => (
              <div key={relatedProduct.id} className="w-full max-w-[290px]">
                <ProductCard
                  product={relatedProduct}
                  locale={locale}
                  newLabel={tProduct('newBadge')}
                  addToCartLabel={tProduct('addToCart', { name: relatedProduct.name })}
                  unavailableLabel={tProduct('unavailable', { name: relatedProduct.name })}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
