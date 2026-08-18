'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/lib/store/cart.store';
import { FOCUS_RING_CLASSNAME } from '@/components/ui/interaction-styles';
import { formatPrice } from '@/lib/utils';
import type { MockProduct } from '@/types';

// max-[641px], не sm:/max-[640px] — Tailwind v4 max-[Npx] компилируется как "< Npx", не "<= Npx"
// (тот же гоча, что у Footer.tsx) — 641 нужен, чтобы включить сам 640px в мобильный диапазон.
// Общие константы, не три раздельных инлайн-класса — раньше центрирование текста жило на
// sm:text-left (срабатывает уже на самом 640px), а размер h1 — на max-[641px], и на 640px
// получалось смешанное состояние (крупный шрифт, но уже прижато влево). Одна точка правки на
// брейкпоинт вместо шести разбросанных по файлу — при следующей смене границы достаточно
// поправить эти три строки, не грепать компонент целиком.
const MOBILE_TEXT_CENTER_CLASSNAME = 'max-[641px]:text-center';
const MOBILE_JUSTIFY_CENTER_CLASSNAME = 'max-[641px]:justify-center';
const MOBILE_H1_SIZE_CLASSNAME = 'max-[641px]:text-[22px]';

// Общий summary/chevron у Composition и Analytical constituents — раньше было продублировано
// целиком на оба <details> (15 строк разметки дважды, отличались только ключом перевода и полем
// данных). py-[10px] — на summary, не на details: раньше падал на details, и реальная кликабельная
// область (сам <summary>) была высотой в один line-height текста (~16.8px, замерено в браузере) —
// ниже минимума touch target 24px по WCAG 2.5.8, паддинг вокруг был чисто визуальным, к прицелу
// клика/тапа не добавлялся. pb-[10px] на <p>, не на details — тот же эффект (отступ снизу под
// текстом при открытом состоянии), но в закрытом details нативный браузер сам скрывает всё, кроме
// summary (display:none на остальных детях), так что этот паддинг не задваивается с паддингом
// summary в закрытом виде.
const DETAIL_SUMMARY_CLASSNAME = `text-label-md flex cursor-pointer list-none items-center justify-between py-[10px] text-neutral-900 [&::-webkit-details-marker]:hidden ${FOCUS_RING_CLASSNAME}`;
const DETAIL_CHEVRON_CLASSNAME =
  'duration-fast h-4 w-4 shrink-0 text-neutral-700 transition-transform group-open:rotate-180 motion-reduce:transition-none';

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

  const firstActiveVariant =
    product.variants.find((variant) => variant.isActive) ?? product.variants[0]!;
  const [selectedVariantId, setSelectedVariantId] = useState(firstActiveVariant.id);
  const selectedVariant =
    product.variants.find((variant) => variant.id === selectedVariantId) ?? firstActiveVariant;
  const price = formatPrice(selectedVariant.price, locale);

  // Composition/Analytical constituents — общий рендер вместо двух копий одной и той же разметки
  // <details>; порядок в массиве = порядок отрисовки (Composition раньше Analytical constituents,
  // design.md → Components).
  const detailSections: { key: string; label: string; value: string }[] = [];
  if (product.composition) {
    detailSections.push({
      key: 'composition',
      label: t('composition'),
      value: product.composition,
    });
  }
  if (product.analyticalConstituents) {
    detailSections.push({
      key: 'analyticalConstituents',
      label: t('analyticalConstituents'),
      value: product.analyticalConstituents,
    });
  }

  return (
    <div className="min-[640px]:max-[670px]:gap-sm flex flex-col gap-[10px]">
      {/* text-[20px]/[16px]/[14px] — по прямому запросу, точечное уменьшение против токенов
          h1(32px)/price(18px)/body-md(15px); вес/line-height от исходных токенов не трогаем
          (h1 — 700/1.2, price — 700/1.2, описание остаётся обычным 400/1.5). Не комбинируем с
          text-h1/text-price/text-body-md в одном className — та же ловушка порядка правил в
          Tailwind CSS, что у Badge.tsx (VARIANT_TYPOGRAPHY_CLASSNAME): при двух text- / leading-
          классах на одном элементе побеждает тот, что позже в скомпилированном CSS, не тот, что
          правее в JSX, поэтому у каждого элемента — один явный набор классов, без токена рядом.
          MOBILE_TEXT_CENTER_CLASSNAME — на 640px и уже (одна колонка, галерея сверху) весь блок
          от названия до чипов фасовки идёт по центру; выше — обратно к левому краю (двухколоночная
          раскладка). Только этот диапазон блоков (до Add to Cart) — кнопка уже full-width
          (центр/лево на неё не влияет), а Composition/Analytical constituents ниже кнопки
          сознательно остаются левым disclosure-паттерном без центрирования. */}
      <h1
        className={`text-[20px] leading-[1.2] font-bold text-neutral-900 ${MOBILE_TEXT_CENTER_CLASSNAME} ${MOBILE_H1_SIZE_CLASSNAME}`}
      >
        {product.name}
      </h1>
      <p
        className={`text-[16px] leading-[1.2] font-bold text-neutral-900 ${MOBILE_TEXT_CENTER_CLASSNAME}`}
      >
        {price}
      </p>
      <p className={`text-[14px] leading-[1.5] text-neutral-700 ${MOBILE_TEXT_CENTER_CLASSNAME}`}>
        {product.description}
      </p>

      {/* Характеристики — не chip-фильтр, а некликабельные метки в том же визуальном языке
          (design.md → Layout «Страница товара»): без обводки, без interactive-состояний.
          py-[4px] px-[10px] — по прямому запросу, вместо px-md/py-sm (16px/8px). */}
      <div className={`gap-sm flex flex-wrap ${MOBILE_JUSTIFY_CENTER_CLASSNAME}`}>
        <span className="text-body-sm rounded-full bg-neutral-100 px-[10px] py-[4px] text-neutral-700">
          {categoryLabel}
        </span>
        <span className="text-body-sm rounded-full bg-neutral-100 px-[10px] py-[4px] text-neutral-700">
          {ageGroupLabel}
        </span>
      </div>

      {/* Чипы не оборачиваются в fieldset/radiogroup: design.md использует тот же паттерн
          selected-состояния, что у filter-чипов каталога, — простые toggle-кнопки. */}
      <div className={`gap-sm flex flex-wrap ${MOBILE_JUSTIFY_CENTER_CLASSNAME}`}>
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
          и clamp(40vw) у галереи (page.tsx) — иначе колонка с текстом не сжималась бы вместе
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
        className="mt-lg w-full min-[640px]:max-[670px]:mt-0 sm:w-[clamp(200px,calc(40vw_-_60px),294px)]"
        onClick={() => addItem(product.id, selectedVariant.id)}
      >
        {selectedVariant.isActive ? t('addToCart') : t('outOfStock')}
      </Button>

      {/* Свёрнуто по умолчанию (design.md → Components «Product composition») — состав/анализ
          нужны не всем покупателям сразу, разворачивать их в открытом виде под каждой карточкой
          раздувало бы страницу. Нативный <details>/<summary> на каждый, не кастомный
          div+aria-expanded: браузер сам даёт клавиатуру/семантику бесплатно, без ручной
          state-машины ради двух блоков. Один общий border-top + divide-y между двумя <details>
          (не border-top на каждом по отдельности) — иначе между Composition и Analytical
          constituents была бы двойная линия. list-none + [&::-webkit-details-marker]:hidden
          убирают дефолтный треугольник маркера во всех движках (Firefox/Chrome слушают list-none,
          Safari — свой псевдоэлемент отдельно) — вместо него свой ChevronDown с поворотом на
          :open через group-open:rotate-180. */}
      {detailSections.length > 0 && (
        // mt-[20px] — по прямому запросу, не токен spacing-шкалы (ближайшие — md/16px, lg/24px,
        // ни один не совпадает).
        <div className="mt-[20px] divide-y divide-neutral-200 border-t border-neutral-200">
          {detailSections.map((section) => (
            <details key={section.key} className="group">
              <summary className={DETAIL_SUMMARY_CLASSNAME}>
                {section.label}
                <ChevronDown aria-hidden="true" className={DETAIL_CHEVRON_CLASSNAME} />
              </summary>
              <p className="text-body-sm mt-sm pb-[10px] text-neutral-700">{section.value}</p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
