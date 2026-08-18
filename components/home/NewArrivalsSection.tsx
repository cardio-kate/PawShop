import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ProductCard } from '@/components/product/ProductCard';
import { MOCK_PRODUCTS } from '@/components/product/mock-data';
import { FOCUS_RING_CLASSNAME } from '@/components/ui/interaction-styles';
import { SECTION_HEADING_GAP_CLASSNAME } from '@/components/home/section-styles';
import { PRODUCT_CARD_GRID_GAP_CLASSNAME } from '@/components/product/product-grid-styles';

// design.md → Layout «View All — только в New Arrivals»: превью показывает только 2 товара из
// isNew, "View All →" ведёт на /catalog (весь ассортимент с фильтрами уже там, разворачивать
// на месте незачем). Кнопка не рендерится вовсе, если новинок ≤ 2 — вести на каталог ради того
// же самого превью не имеет смысла.
export async function NewArrivalsSection() {
  const t = await getTranslations('Home.newArrivals');
  const tProduct = await getTranslations('Product');
  const locale = await getLocale();
  const newProducts = MOCK_PRODUCTS.filter((product) => product.isNew);
  const preview = newProducts.slice(0, 2);

  return (
    // pt-[40px] — по прямому запросу: в отличие от About (p-lg/24px) и Value Props (py-xl/40px),
    // у секции не было собственного верхнего паддинга вообще, поэтому межсекционный gap-[60px]
    // (HomePage) перед New Arrivals визуально читался короче, чем перед Value Props (там 60px
    // gap + 40px padding секции суммируются). Теперь оба перехода дают одинаковые 100px.
    // pb-lg (24px) — по прямому запросу, отступ под View All перед Footer.
    <section id="new-arrivals" className="pb-lg scroll-mt-20 pt-[40px]">
      <div className="gap-sm flex flex-col items-center text-center">
        <p className="text-label-caps text-neutral-500">{t('eyebrow')}</p>
        <h2 className="text-section-heading text-neutral-900 uppercase">{t('title')}</h2>
      </div>

      {/* Брейкпоинт 800/801 и ширина ряда 610px — design.md → Components «Сетка New Arrivals».
          PRODUCT_CARD_GRID_GAP_CLASSNAME (30px) — по прямому запросу фиксирован на всех экранах
          (раньше был gap-[25px] на <801px, gap-[30px] на ≥801px — по прямому запросу отменено,
          значение не должно зависеть от ширины экрана) и вынесен в общую константу, единую для
          всех сеток карточек товара на сайте (components/product/product-grid-styles.ts); не
          токен gap-gutter (24px). Ширина ряда на ≥801px пересчитана под него
          (290+290+30=610, было 290+290+24=604) — иначе с фикс. gap 30px при старой
          604px-обёртке карточки сжались бы ниже 290px. */}
      <div
        className={`${SECTION_HEADING_GAP_CLASSNAME} mx-auto flex flex-col items-center ${PRODUCT_CARD_GRID_GAP_CLASSNAME} min-[801px]:grid min-[801px]:w-[610px] min-[801px]:grid-cols-2`}
      >
        {preview.map((product, index) => (
          <div key={product.id} className="w-full max-w-[320px] min-[801px]:max-w-none">
            <ProductCard
              product={product}
              locale={locale}
              newLabel={tProduct('newBadge')}
              addToCartLabel={tProduct('addToCart', { name: product.name })}
              unavailableLabel={tProduct('unavailable', { name: product.name })}
              priority={index < 4}
            />
          </div>
        ))}
      </div>

      {/* mt-[45px] — по прямому запросу, не токен: ни один из spacing.lg (24px)/spacing.xl (40px)
          не даёт ровно 45px. */}
      {newProducts.length > 2 && (
        <div className="mt-[45px] flex justify-center">
          <Link
            href="/catalog"
            className={`text-label-md text-paw duration-fast hover:text-paw-hover transition-colors motion-reduce:transition-none ${FOCUS_RING_CLASSNAME}`}
          >
            {t('viewAll')}
          </Link>
        </div>
      )}
    </section>
  );
}
