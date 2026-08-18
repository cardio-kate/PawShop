import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/Badge';
import { AddToCartButton } from '@/components/product/AddToCartButton';
import { FOCUS_RING_CLASSNAME } from '@/components/ui/interaction-styles';
import { formatPrice } from '@/lib/utils';
import type { MockProduct } from '@/types';

interface ProductCardProps {
  product: MockProduct;
  locale: string;
  newLabel: string;
  addToCartLabel: string;
  addedToCartLabel: string;
  unavailableLabel: string;
  // CLAUDE.md → «Загрузка изображений»: priority только для первых 2–4 карточек в первом экране,
  // не на всю сетку — по умолчанию false, вызывающая сторона (CatalogClient/NewArrivalsSection)
  // решает, какие карточки выше сгиба.
  priority?: boolean;
}

// Презентационный компонент без getTranslations/getLocale внутри (в отличие от Footer) — так его
// можно рендерить и из Server Component (Catalog/New Arrivals), и временно из клиентского
// ui-playground для визуальной проверки, не пробрасывая через границу server/client функцию t().
// Тексты и locale приходят пропсами, резолвит их вызывающий компонент.
export function ProductCard({
  product,
  locale,
  newLabel,
  addToCartLabel,
  addedToCartLabel,
  unavailableLabel,
  priority,
}: ProductCardProps) {
  const price = formatPrice(product.price, locale);
  // Карточка каталога не даёт выбрать вариант — в корзину уходит самый дешёвый активный, тот же,
  // чья цена уже показана на карточке (product.price = MIN активных вариантов, CLAUDE.md → «База
  // данных»). Явный поиск по цене, а не «первый active в массиве» — порядок вариантов не гарантирует
  // возрастание цены. Выбор конкретного варианта — только на странице товара (ProductDetailClient).
  // activeVariants может быть пустым (все варианты деактивированы, но сам товар ещё isActive) —
  // тогда defaultVariant откатывается на product.variants[0] (неактивный), и кнопка ниже
  // блокируется через isAvailable, а не молча добавляет недоступный вариант в корзину.
  const activeVariants = product.variants.filter((variant) => variant.isActive);
  const isAvailable = activeVariants.length > 0;
  const defaultVariant = activeVariants.reduce(
    (cheapest, variant) => (variant.price < cheapest.price ? variant : cheapest),
    activeVariants[0] ?? product.variants[0]!,
  );

  return (
    // h-full flex flex-col + mt-auto у нижнего блока (цена/кнопка): в сетке карточки с более
    // длинным названием (2 строки) без этого проседали ниже соседних — цена/кнопка съезжали
    // на разную высоту от карточки к карточке. Требует stretch по высоте от родительского ряда
    // (родитель должен НЕ выставлять свой items-center, иначе h-full не от чего считать).
    // Без padding на карточке (design.md → «Product card», токен product-card) — фото 4:5 ложится
    // вплотную к краям, название/цена/кнопка ниже идут в том же инсете без собственного отступа.
    <div className="rounded-card bg-surface flex h-full w-full flex-col">
      <Link
        href={`/product/${product.slug}`}
        className={`rounded-card relative block aspect-[4/5] overflow-hidden bg-neutral-100 ${FOCUS_RING_CLASSNAME}`}
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
          priority={priority}
        />
        {product.isNew && (
          <Badge variant="new" className="left-sm top-sm absolute">
            {newLabel}
          </Badge>
        )}
      </Link>

      <Link
        href={`/product/${product.slug}`}
        className={`mt-sm text-body-md block text-neutral-900 ${FOCUS_RING_CLASSNAME}`}
      >
        {product.name}
      </Link>

      <div className="gap-sm mt-auto flex items-center justify-between">
        <span className="text-price text-neutral-900">{price}</span>
        <AddToCartButton
          productId={product.id}
          variantId={defaultVariant.id}
          label={isAvailable ? addToCartLabel : unavailableLabel}
          announceLabel={addedToCartLabel}
          disabled={!isAvailable}
        />
      </div>
    </div>
  );
}
