'use client';

import { Check, Plus } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart.store';
import { FOCUS_RING_CLASSNAME } from '@/components/ui/interaction-styles';
import { LiveRegion } from '@/components/ui/LiveRegion';
import { useAnnouncement } from '@/lib/hooks/useAnnouncement';
import { useAddedFeedback } from '@/lib/hooks/useAddedFeedback';

interface AddToCartButtonProps {
  productId: string;
  variantId: string;
  label: string;
  // Текст подтверждения для aria-live (a11y-review checklist п.6 «Динамический контент»):
  // клик по кнопке — единственный визуальный сигнал успеха бейдж-счётчик в Header, скринридер
  // его не видит. Готовая строка приходит от вызывающей стороны (тот же DI-паттерн, что и у
  // `label` — ProductCard/CatalogClient уже резолвят переводы с именем товара, дублировать
  // useTranslations здесь не нужно).
  announceLabel: string;
  disabled?: boolean;
}

// button-add-circle (design.md → Components): маленький клиентский остров внутри в остальном
// серверного ProductCard — так карточка сама остаётся Server Component (SSR/SEO, CLAUDE.md
// «Кэш и SEO»), а к Zustand-стору обращается только эта кнопка.
// disabled — тот же неактивный-вариант-по-умолчанию случай, что и на странице товара
// (ProductDetailClient.tsx): если у товара нет ни одного активного варианта, variantId,
// переданный сюда, — недоступный, добавлять его в корзину нельзя. Цвет — тот же
// DISABLED_CLASSNAME-язык, что у Button.tsx (neutral-300/500), но локально: это button-add-circle,
// не Button.tsx, общего компонента для этой формы нет.
export function AddToCartButton({
  productId,
  variantId,
  label,
  announceLabel,
  disabled,
}: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [announcement, announce] = useAnnouncement();
  const [added, triggerAdded] = useAddedFeedback();

  function handleClick() {
    addItem(productId, variantId);
    announce(announceLabel);
    triggerAdded();
  }

  // added ? 'bg-paw-active' : 'bg-paw' — одна ветка, не bg-paw и добавленный поверх bg-paw-active
  // одновременно: обе утилиты одной специфичности, порядок в скомпилированном Tailwind CSS не
  // совпадает с порядком классов в атрибуте, при обоих одновременно исход непредсказуем (тот же
  // класс проблемы, что у VARIANT_TYPOGRAPHY_CLASSNAME в ProductDetailClient.tsx).
  const backgroundClassName = added ? 'bg-paw-active' : 'bg-paw';

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={handleClick}
        aria-label={label}
        className={`${backgroundClassName} text-surface duration-fast hover:bg-paw-hover active:bg-paw-active flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full transition-colors motion-reduce:transition-none ${FOCUS_RING_CLASSNAME} enabled:cursor-pointer disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500 disabled:hover:bg-neutral-300 disabled:active:bg-neutral-300`}
      >
        {added ? (
          <Check className="animate-icon-in h-5 w-5 motion-reduce:animate-none" aria-hidden="true" />
        ) : (
          <Plus className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
      <LiveRegion message={announcement} />
    </>
  );
}
