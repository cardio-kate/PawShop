'use client';

import Image from 'next/image';
import { Minus, Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCartStore } from '@/lib/store/cart.store';
import { FOCUS_RING_CLASSNAME } from '@/components/ui/interaction-styles';
import { formatPrice } from '@/lib/utils';
import type { MockProduct, MockVariant } from '@/types';

interface CartItemProps {
  product: MockProduct;
  variant: MockVariant;
  quantity: number;
  locale: string;
}

// design.md → Components «Cart item»: миниатюра, название (label-md, не body-md — на двух строках
// у более просторного line-height остаётся лишний зазор под короткий жирный лейбл), вариант,
// степпер количества, цена строки (variant.price * quantity, не цена за штуку — так сумма в строке
// сразу читается без арифметики в уме), удаление.
export function CartItem({ product, variant, quantity, locale }: CartItemProps) {
  const t = useTranslations('Cart');
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const lineTotal = formatPrice(variant.price * quantity, locale);

  return (
    <li className="flex gap-md">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-card bg-neutral-100">
        <Image src={product.images[0]!} alt={product.name} fill sizes="64px" className="object-cover" />
      </div>

      <div className="flex flex-1 flex-col gap-xs">
        <div className="flex items-center justify-between gap-sm">
          <span className="text-label-md leading-[1.2] text-neutral-900">{product.name}</span>
          <button
            type="button"
            onClick={() => removeItem(product.id, variant.id)}
            aria-label={t('remove', { name: product.name })}
            className={`shrink-0 cursor-pointer rounded-full p-1 text-neutral-500 transition-colors duration-fast hover:text-paw motion-reduce:transition-none ${FOCUS_RING_CLASSNAME}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <span className="text-body-sm text-neutral-500">{variant.label}</span>

        <div className="mt-auto flex items-center justify-between gap-sm">
          <div className="flex items-center gap-xs rounded-full border border-neutral-300">
            <button
              type="button"
              onClick={() => updateQuantity(product.id, variant.id, quantity - 1)}
              aria-label={t('decreaseQuantity')}
              className={`flex h-7 w-7 cursor-pointer items-center justify-center text-neutral-700 transition-colors duration-fast hover:text-paw motion-reduce:transition-none ${FOCUS_RING_CLASSNAME}`}
            >
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span className="min-w-4 text-center text-body-sm text-neutral-900">{quantity}</span>
            <button
              type="button"
              onClick={() => updateQuantity(product.id, variant.id, quantity + 1)}
              aria-label={t('increaseQuantity')}
              className={`flex h-7 w-7 cursor-pointer items-center justify-center text-neutral-700 transition-colors duration-fast hover:text-paw motion-reduce:transition-none ${FOCUS_RING_CLASSNAME}`}
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
