'use client';

import { Plus } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart.store';
import { FOCUS_RING_CLASSNAME } from '@/components/ui/interaction-styles';

interface AddToCartButtonProps {
  productId: string;
  variantId: string;
  label: string;
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
export function AddToCartButton({ productId, variantId, label, disabled }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => addItem(productId, variantId)}
      aria-label={label}
      className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-paw text-surface transition-colors duration-fast hover:bg-paw-hover active:bg-paw-active motion-reduce:transition-none ${FOCUS_RING_CLASSNAME} disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500 disabled:hover:bg-neutral-300 disabled:active:bg-neutral-300 enabled:cursor-pointer`}
    >
      <Plus className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
