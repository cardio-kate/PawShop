'use client';

import Image from 'next/image';
import { Minus, Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCartStore } from '@/lib/store/cart.store';
import {
  FOCUS_RING_CLASSNAME,
  iconActionButtonClassName,
} from '@/components/ui/interaction-styles';
import { formatPrice } from '@/lib/utils';
import { multiplyByQuantity } from '@/lib/money';
import type { ResolvedCartItem } from '@/components/cart/useResolvedCartItems';

interface CartItemProps {
  product: ResolvedCartItem['product'];
  variant: ResolvedCartItem['variant'];
  productId: number;
  variantId: number;
  quantity: number;
  locale: string;
}

// design.md → Components «Cart item»: миниатюра, название (label-md, не body-md — на двух строках
// у более просторного line-height остаётся лишний зазор под короткий жирный лейбл), вариант,
// степпер количества, цена строки (variant.price * quantity, не цена за штуку — так сумма в строке
// сразу читается без арифметики в уме), удаление. price — numeric(10,2)-строка, умножение на
// quantity идёт через lib/money.ts (CLAUDE.md → «Тесты»), не через JS `*` в обход строкового типа.
export function CartItem({ product, variant, productId, variantId, quantity, locale }: CartItemProps) {
  const t = useTranslations('Cart');
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const lineTotal = formatPrice(multiplyByQuantity(variant.price, quantity), locale);

  return (
    <li className="gap-md flex">
      <div className="rounded-card relative w-16 shrink-0 self-stretch overflow-hidden bg-neutral-100">
        <Image
          src={product.images[0]!}
          alt={product.name}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>

      <div className="gap-xs flex flex-1 flex-col">
        <div className="gap-sm flex items-center justify-between">
          <span className="text-label-md leading-[1.2] text-neutral-900">{product.name}</span>
          <button
            type="button"
            onClick={() => removeItem(productId, variantId)}
            aria-label={t('remove', { name: product.name })}
            className={`shrink-0 ${iconActionButtonClassName('muted')}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <span className="text-body-sm text-neutral-500">{variant.label}</span>

        <div className="gap-sm mt-auto flex items-center justify-between">
          <div className="gap-xs flex items-center rounded-full border border-neutral-300">
            <button
              type="button"
              onClick={() => updateQuantity(productId, variantId, quantity - 1)}
              aria-label={t('decreaseQuantity')}
              className={`duration-fast hover:text-paw flex h-7 w-7 cursor-pointer items-center justify-center text-neutral-700 transition-colors motion-reduce:transition-none ${FOCUS_RING_CLASSNAME}`}
            >
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span className="text-body-sm min-w-4 text-center text-neutral-900">{quantity}</span>
            <button
              type="button"
              onClick={() => updateQuantity(productId, variantId, quantity + 1)}
              aria-label={t('increaseQuantity')}
              className={`duration-fast hover:text-paw flex h-7 w-7 cursor-pointer items-center justify-center text-neutral-700 transition-colors motion-reduce:transition-none ${FOCUS_RING_CLASSNAME}`}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <span className="text-body-sm text-neutral-900">{lineTotal}</span>
        </div>
      </div>
    </li>
  );
}
