import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ProductCard } from '@/components/product/ProductCard';
import { MOCK_PRODUCTS } from '@/components/product/mock-data';

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
      <div className="flex flex-col items-center gap-[0.7rem] text-center">
        <p className="text-label-caps text-neutral-500">{t('eyebrow')}</p>
        <h2 className="text-section-heading text-neutral-900">{t('title')}</h2>
      </div>

      <div className="mt-lg grid grid-cols-1 gap-gutter sm:grid-cols-2">
        {preview.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            locale={locale}
            newLabel={tProduct('newBadge')}
            addToCartLabel={tProduct('addToCart', { name: product.name })}
          />
        ))}
      </div>

      {newProducts.length > 2 && (
        <div className="mt-lg flex justify-center">
          <Link
            href="/catalog"
            className="text-label-md text-paw transition-colors duration-fast hover:text-paw-hover motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw"
          >
            {t('viewAll')}
          </Link>
        </div>
      )}
    </section>
  );
}
