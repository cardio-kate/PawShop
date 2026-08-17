'use client';

import { useMemo } from 'react';
import { useCartStore } from '@/lib/store/cart.store';
import { MOCK_PRODUCTS } from '@/components/product/mock-data';
import type { MockProduct, MockVariant } from '@/types';

export interface ResolvedCartItem {
  productId: string;
  variantId: string;
  quantity: number;
  product: MockProduct;
  variant: MockVariant;
}

// Общий резолв для CartDrawer и /checkout: стор хранит только { productId, variantId, quantity }
// (контракт, который останется верным и с реальным backend), а название/фото/цена сейчас
// подтягиваются из MOCK_PRODUCTS. Это единственное место со знанием об этом источнике — когда
// появится getProducts(), достаточно поменять резолв здесь, а не в каждом потребителе.
// variant.isActive проверяется здесь же, наравне с самим наличием product/variant — вариант,
// деактивированный уже после того, как лёг в корзину, для пользователя такая же «недоступная
// позиция», как удалённый товар (CLAUDE.md → «Заказ и корзина»), и не должен молча показываться
// по полной цене как обычная строка. Обе ветки считает useUnavailableCartItemCount ниже.
// items — прямая ссылка на срез стора (Zustand отдаёт тот же массив, пока он не заменён
// иммутабельно), значит useMemo реально пропускает пересчёт на ре-рендерах, не вызванных
// изменением корзины (например, каждую букву в поиске Header — Header тоже вызывает этот
// резолв через useResolvedCartItemCount ниже).
export function useResolvedCartItems(): ResolvedCartItem[] {
  const items = useCartStore((state) => state.items);

  return useMemo(
    () =>
      items.flatMap((item) => {
        const product = MOCK_PRODUCTS.find((p) => p.id === item.productId);
        const variant = product?.variants.find((v) => v.id === item.variantId);
        return product && variant && variant.isActive ? [{ ...item, product, variant }] : [];
      }),
    [items],
  );
}

// CartDrawer и /checkout считали одну и ту же сумму каждый у себя — вынесено сюда, чтобы
// будущее изменение прайсинга (скидки, округление) не пришлось синхронизировать в двух местах.
export function getCartSubtotal(items: ResolvedCartItem[]): number {
  return items.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);
}

// Бейдж корзины в Header обязан считать количество по тому же резолву, что CartDrawer/checkout,
// а не сырые quantity прямо из стора — иначе строка, которая не резолвится в MOCK_PRODUCTS
// (удалённый/деактивированный товар), даёт бейджу одну цифру, а списку — другую, без предупреждения.
export function useResolvedCartItemCount(): number {
  return useResolvedCartItems().reduce((sum, item) => sum + item.quantity, 0);
}

// Строки, исключённые в useResolvedCartItems (удалённый товар или деактивированный вариант), не
// должны пропадать бесследно — CartDrawer/CheckoutClient показывают это число как предупреждение,
// а не оставляют пользователя гадать, почему сумма и localStorage разошлись. Число — разница
// длин сырых items и уже отфильтрованных resolvedItems (flatMap выше отображает каждую строку
// стора либо в одну резолвленную запись, либо ни в одну), а не отдельный проход с тем же
// MOCK_PRODUCTS.find()/variants.find() — раньше это был независимый второй обход корзины.
export function useUnavailableCartItemCount(): number {
  const items = useCartStore((state) => state.items);
  const resolvedItems = useResolvedCartItems();

  return items.length - resolvedItems.length;
}
