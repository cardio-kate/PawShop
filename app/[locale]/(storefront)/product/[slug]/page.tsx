import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductDetailClient } from '@/components/product/ProductDetailClient';
import { ProductCard } from '@/components/product/ProductCard';
import { getProductBySlug, getRelatedProducts } from '@/actions/products.actions';
import { getCategories } from '@/lib/db/queries/products.queries';
import { getProductGridColumnsClassName } from '@/components/product/getProductGridColumnsClassName';
import { RELATED_PRODUCTS_TOP_GAP_CLASSNAME } from '@/components/product/related-products-styles';
import { PRODUCT_CARD_GRID_GAP_CLASSNAME } from '@/components/product/product-grid-styles';
import { STOREFRONT_PAGE_CONTAINER_CLASSNAME } from '@/components/layout/page-styles';
import type { routing } from '@/i18n/routing';

// generateStaticParams — намеренно не заведён: витрина уже рендерится SSR (`ƒ`), не SSG (CLAUDE.md
// → «Кэш и SEO», известный gap с next-intl/Cache Components из-за Header'а), список слагов для
// пререндера в этом режиме ничего не даёт.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug, locale as (typeof routing.locales)[number]);
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

  const typedLocale = locale as (typeof routing.locales)[number];
  const product = await getProductBySlug(slug, typedLocale);
  if (!product) notFound();

  const categories = await getCategories();
  const category = categories.find((c) => c.id === product.categoryId);
  const categoryLabel = category ? (locale === 'de' ? category.nameDe : category.nameEn) : '';

  const tCatalog = await getTranslations('Catalog');
  const tProduct = await getTranslations('Product');
  const tProductPage = await getTranslations('ProductPage');
  const ageGroupLabel = tCatalog(`ageGroups.${product.ageGroup}`);
  const related = await getRelatedProducts(product.id, typedLocale);

  return (
    <div className={STOREFRONT_PAGE_CONTAINER_CLASSNAME}>
      {/* Колонка галереи — clamp(…,40vw,360px), не фиксированные 360px: на bp-sm..~1024px 360px
          съедал бы почти всю ширину экрана, оставляя тексту только свой min-content (кнопка
          Add to Cart, см. ProductDetailClient.tsx) — колонки визуально «расходились», картинка
          сжималась резче текста. Потолок 360, не 450 — ProductGallery.tsx: аспект 4:5, не
          square (design.md → Components «Product card»), высота 450px, ширина 450×4/5=360px.
          Пол клэмпа — 312px (замерено в браузере: значение формулы (40vw − 48px) ровно при
          900px viewport), не более низкий 192px, отмасштабированный от прежнего square-клэмпа —
          по прямому запросу: ниже ~900px текстовая колонка (с Composition/Analytical
          constituents) становится выше картинки быстрее, чем сама картинка успевает сжаться, и
          колонки визуально расходятся по высоте. С полом в 312px картинка перестаёт уменьшаться
          от ~900px и до bp-sm (640px), а сжимается вместо неё только текстовая колонка (`1fr`,
          и так эластичная) — контента с большим количеством текста ужиматься по ширине привычнее,
          чем фото. Gap — тем же приёмом: gap-xl (40px) только до bp-sm (вертикальный зазор между
          фото и текстом в один столбец), с bp-sm — clamp сжимается до 16px и восстанавливается до
          gap-xl к тому же ~1024px, где галерея достигает потолка. */}
      {/* min-[641px]:, не sm: (=640px) — ProductDetailClient.tsx держит мобильный вид (центрирование,
          крупный h1) до max-[641px] включительно (тот же Tailwind v4 гоча про max-[Npx] как "< Npx").
          Грид должен переключаться на два столбца ровно там же, где текст перестаёт быть
          мобильным, иначе на самом 640px получается двухколоночная раскладка с ещё центрированным
          текстом — та же нестыковка, которую ProductDetailClient.tsx уже один раз чинил у себя
          внутри (см. комментарий к MOBILE_TEXT_CENTER_CLASSNAME), здесь ей же противоположный конец. */}
      <div className="gap-xl grid grid-cols-1 min-[641px]:grid-cols-[clamp(312px,calc(40vw_-_48px),360px)_1fr] min-[641px]:gap-[clamp(16px,calc(6vw_-_22px),40px)]">
        <ProductGallery images={product.images} alt={product.name} />
        <ProductDetailClient
          product={product}
          categoryLabel={categoryLabel}
          ageGroupLabel={ageGroupLabel}
        />
      </div>

      {/* design.md → Components «You may also like»: не рендерится вовсе, если подходящих
          товаров не нашлось — не показывать пустую сетку с одним заголовком. */}
      {related.length > 0 && (
        // gap-[50px] (не gap-lg) — тот же зазор заголовок→контент, что и у секций главной
        // (components/home/section-styles.ts, SECTION_HEADING_GAP_CLASSNAME); здесь как gap,
        // а не margin-top, потому что h2 и сетка — единственные два ребёнка одного flex-col.
        // RELATED_PRODUCTS_TOP_GAP_CLASSNAME (80px, было 60px) — по прямому запросу.
        <div className={`${RELATED_PRODUCTS_TOP_GAP_CLASSNAME} flex flex-col gap-[50px]`}>
          <h2 className="text-section-heading font-display text-center text-neutral-900 uppercase">
            {tProductPage('relatedTitle')}
          </h2>
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
              контейнера). PRODUCT_CARD_GRID_GAP_CLASSNAME (30px), не gap-gutter (24px) — по
              прямому запросу, единое значение для всех сеток карточек товара на сайте
              (components/product/product-grid-styles.ts). */}
          <div
            className={`grid justify-center justify-items-center lg:justify-start lg:justify-items-start ${PRODUCT_CARD_GRID_GAP_CLASSNAME} ${getProductGridColumnsClassName(related.length)}`}
          >
            {related.map((relatedProduct, index) => (
              <div key={relatedProduct.id} className="w-full max-w-[290px]">
                <ProductCard
                  product={relatedProduct}
                  locale={locale}
                  newLabel={tProduct('newBadge')}
                  addToCartLabel={tProduct('addToCart', { name: relatedProduct.name })}
                  addedToCartLabel={tProduct('addedToCart', { name: relatedProduct.name })}
                  unavailableLabel={tProduct('unavailable', { name: relatedProduct.name })}
                  priority={index < 4}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
