import Image from 'next/image';
import { Plus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/Badge';
import type { MockProduct } from '@/types';

interface ProductCardProps {
  product: MockProduct;
  locale: string;
  newLabel: string;
  addToCartLabel: string;
}

// Презентационный компонент без getTranslations/getLocale внутри (в отличие от Footer) — так его
// можно рендерить и из Server Component (Catalog/New Arrivals), и временно из клиентского
// ui-playground для визуальной проверки, не пробрасывая через границу server/client функцию t().
// Тексты и locale приходят пропсами, резолвит их вызывающий компонент.
export function ProductCard({ product, locale, newLabel, addToCartLabel }: ProductCardProps) {
  const price = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(product.price);

  return (
    // h-full flex flex-col + mt-auto у нижнего блока (цена/кнопка): в сетке карточки с более
    // длинным названием (2 строки) без этого проседали ниже соседних — цена/кнопка съезжали
    // на разную высоту от карточки к карточке. Требует stretch по высоте от родительского ряда
    // (родитель должен НЕ выставлять свой items-center, иначе h-full не от чего считать).
    <div className="flex h-full w-full flex-col rounded-card bg-surface p-[10px]">
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-card bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw"
      >
        <Image
          // images[0] всегда есть — товар без единой фотографии не сохраняется на сервере
          // (architecture.md, «Товар без единой фотографии сохранить нельзя»), noUncheckedIndexedAccess
          // просто не знает об этом инварианте на уровне типа string[].
          src={product.images[0]!}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="rounded-card object-cover"
        />
        {product.isNew && (
          <Badge variant="new" className="absolute left-sm top-sm">
            {newLabel}
          </Badge>
        )}
      </Link>

      <Link
        href={`/product/${product.slug}`}
        className="mt-sm block text-body-md text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw"
      >
        {product.name}
      </Link>

      <div className="mt-auto flex items-center justify-between gap-sm">
        <span className="text-price text-neutral-900">{price}</span>
        {/* button-add-circle (design.md → Components): 42px, заливка paw. Добавление в корзину
            подключится в Фазе 5 (Zustand), пока некликабельная заглушка. */}
        <button
          type="button"
          aria-label={addToCartLabel}
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-paw text-surface transition-colors duration-fast hover:bg-paw-hover active:bg-paw-active focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
