'use client';

import { useMemo } from 'react';
import { useCartStore } from '@/lib/store/cart.store';
import { sum, multiplyByQuantity } from '@/lib/money';

// Строка корзины строится прямо из снапшота, сохранённого в сторе при добавлении (lib/store/
// cart.store.ts) — никакого повторного поиска товара по id: в ТЗ §5 нет action под "получить
// товары по списку id", а искать заново через getProductBySlug/getProducts на каждую строку было
// бы N лишних запросов ради данных, которые уже есть. Актуальность (удалён/деактивирован ли товар
// с тех пор) сервер всё равно перепроверяет заново при createOrder (CLAUDE.md → «Заказ и
// корзина») — эта проверка сознательно не дублируется здесь.
export interface ResolvedCartItem {
  productId: number;
  variantId: number;
  quantity: number;
  product: { name: string; slug: string; images: string[] };
  variant: { label: string; price: string };
}

export function useResolvedCartItems(): ResolvedCartItem[] {
  const items = useCartStore((state) => state.items);

  return useMemo(
    () =>
      items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        product: { name: item.productName, slug: item.productSlug, images: [item.productImage] },
        variant: { label: item.variantLabel, price: item.price },
      })),
    [items],
  );
}

// CartDrawer и /checkout считали одну и ту же сумму каждый у себя — вынесено сюда, чтобы
// будущее изменение прайсинга (скидки, округление) не пришлось синхронизировать в двух местах.
// numeric(10,2)-строки, не JS-числа (CLAUDE.md → «Тесты», «Денежная арифметика») — сложение через
// lib/money.ts на каждом шаге, не Number()/parseFloat.
export function getCartSubtotal(items: ResolvedCartItem[]): string {
  return sum(items.map((item) => multiplyByQuantity(item.variant.price, item.quantity)));
}

// Бейдж корзины в Header обязан считать количество по тому же резолву, что CartDrawer/checkout,
// а не сырые quantity прямо из стора — оставлено на случай будущего расхождения источников, хотя
// сейчас (после перехода на снапшот) resolvedItems всегда совпадает по длине с сырыми items.
export function useResolvedCartItemCount(): number {
  return useResolvedCartItems().reduce((sum, item) => sum + item.quantity, 0);
}
