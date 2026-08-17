import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ProductCard } from '@/components/product/ProductCard';
import { MOCK_PRODUCTS } from '@/components/product/mock-data';
import { FOCUS_RING_CLASSNAME } from '@/components/ui/interaction-styles';

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
    <section id="new-arrivals" className="scroll-mt-20">
      <div className="flex flex-col items-center gap-sm text-center">
        <p className="text-label-caps text-neutral-500">{t('eyebrow')}</p>
        <h2 className="text-section-heading uppercase text-neutral-900">{t('title')}</h2>
      </div>

      {/* Брейкпоинт 800/801 и ширина ряда 604px — design.md → Components «Сетка New Arrivals». */}
      <div className="mx-auto mt-lg flex flex-col items-center gap-md min-[801px]:grid min-[801px]:w-[604px] min-[801px]:grid-cols-2 min-[801px]:gap-gutter">
        {preview.map((product) => (
          <div key={product.id} className="w-full max-w-[320px] min-[801px]:max-w-none">
            <ProductCard
              product={product}
              locale={locale}
              newLabel={tProduct('newBadge')}
              addToCartLabel={tProduct('addToCart', { name: product.name })}
              unavailableLabel={tProduct('unavailable', { name: product.name })}
            />
          </div>
        ))}
      </div>

      {newProducts.length > 2 && (
        <div className="mt-lg flex justify-center">
          <Link
            href="/catalog"
            className={`text-label-md text-paw transition-colors duration-fast hover:text-paw-hover motion-reduce:transition-none ${FOCUS_RING_CLASSNAME}`}
          >
            {t('viewAll')}
          </Link>
        </div>
      )}
    </section>
  );
}
