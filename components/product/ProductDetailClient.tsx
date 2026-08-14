'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
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

  const firstActiveVariant = product.variants.find((variant) => variant.isActive) ?? product.variants[0]!;
  const [selectedVariantId, setSelectedVariantId] = useState(firstActiveVariant.id);
  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId) ?? firstActiveVariant;
  const price = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(selectedVariant.price);

  return (
    <div className="flex flex-col gap-md">
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
      <div className="mt-sm flex flex-wrap gap-sm">
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

      {/* design.md → Product card «Между чипами вариантов и строкой цена/кнопка — отступ
          spacing.lg»: тот же зазор применён здесь, перед единственной кнопкой действия страницы. */}
      <Button
        variant="primary"
        className="mt-lg w-full sm:w-auto"
        onClick={() => {
          // Add to Cart — no-op до подключения Zustand-стора в Фазе 5 (см. план).
          console.log('Add to cart (Phase 5 wiring pending):', product.id, selectedVariant.id);
        }}
      >
        {t('addToCart')}
      </Button>
    </div>
  );
}
