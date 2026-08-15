'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/lib/store/cart.store';
import { formatPrice } from '@/lib/utils';
import type { MockProduct } from '@/types';

// design.md → Layout «Страница товара» (§7.3 ТЗ): порядок блоков сверху вниз — название / цена /
// описание / характеристики / variant chip / Add to Cart. Цена пересчитывается на выбранный
// вариант — Intl.NumberFormat(locale, EUR), тот же форматтер, что и в ProductCard.
export function ProductDetailClient({
  product,
  categoryLabel,
  ageGroupLabel,
}: {
  product: MockProduct;
  categoryLabel: string;
  ageGroupLabel: string;
}) {
  const t = useTranslations('ProductPage');
  const locale = useLocale();
  const addItem = useCartStore((state) => state.addItem);

  const firstActiveVariant = product.variants.find((variant) => variant.isActive) ?? product.variants[0]!;
  const [selectedVariantId, setSelectedVariantId] = useState(firstActiveVariant.id);
  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId) ?? firstActiveVariant;
  const price = formatPrice(selectedVariant.price, locale);

  return (
    <div className="flex flex-col gap-[12px] min-[640px]:max-[670px]:gap-sm">
      <h1 className="text-h1 text-neutral-900">{product.name}</h1>
      <p className="text-price text-neutral-900">{price}</p>
      <p className="text-body-md text-neutral-700">{product.description}</p>

      {/* Характеристики — не chip-фильтр, а некликабельные метки в том же визуальном языке
          (design.md → Layout «Страница товара»): без обводки, без interactive-состояний. */}
      <div className="flex flex-wrap gap-sm">
        <span className="rounded-full bg-neutral-100 px-md py-sm text-body-sm text-neutral-700">
          {categoryLabel}
        </span>
        <span className="rounded-full bg-neutral-100 px-md py-sm text-body-sm text-neutral-700">
          {ageGroupLabel}
        </span>
      </div>

      {/* Чипы не оборачиваются в fieldset/radiogroup: design.md использует тот же паттерн
          selected-состояния, что у filter-чипов каталога, — простые toggle-кнопки. */}
      <div className="flex flex-wrap gap-sm">
        {product.variants.map((variant) => (
          <Chip
            key={variant.id}
            kind="variant"
            selected={variant.id === selectedVariantId}
            disabled={!variant.isActive}
            onClick={() => setSelectedVariantId(variant.id)}
          >
            {variant.isActive ? variant.label : `${variant.label} — ${t('outOfStock')}`}
          </Chip>
        ))}
      </div>

      {/* mt-lg — spacing.lg перед кнопкой (design.md); на 640–670px гасится (min-[640px]:max-[670px]:mt-0),
          там хватает общего flex-gap. sm:w-[clamp(...)] держит кнопку в той же пропорции, что
          и clamp(50vw) у галереи (page.tsx) — иначе колонка с текстом не сжималась бы вместе
          с фото на bp-sm..bp-lg; 294px — потолок (sm:w-auto на широких экранах, замерено
          в браузере). */}
      {/* disabled={!selectedVariant.isActive} — чипы блокируют клик по конкретному неактивному
          варианту (disabled={!variant.isActive} выше), но не перепроверяют дефолтное/fallback-
          состояние: если у товара вообще нет активных вариантов, firstActiveVariant откатывается
          на variants[0] (неактивный) — без этой проверки кнопка добавляла бы в корзину недоступный
          вариант. */}
      <Button
        variant="primary"
        size="sm"
        disabled={!selectedVariant.isActive}
        className="mt-lg w-full sm:w-[clamp(200px,calc(40vw_-_60px),294px)] min-[640px]:max-[670px]:mt-0"
        onClick={() => addItem(product.id, selectedVariant.id)}
      >
        {selectedVariant.isActive ? t('addToCart') : t('outOfStock')}
      </Button>
    </div>
  );
}
