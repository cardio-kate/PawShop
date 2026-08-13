import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

export const useCartStore = create<CartState>()(
  persist(
    () => ({
      items: [] as CartItem[],
    }),
    // skipHydration: сервер не знает содержимое localStorage — без этого флага первый клиентский
    // рендер мог бы разойтись с серверным (hydration mismatch) + видимое моргание 0 → N на
    // счётчике корзины в Header. Гидратация запускается вручную (см. Header.tsx) уже после маунта.
    { name: 'pawshop-cart', skipHydration: true },
  ),
);

export function useCartItemCount(): number {
  return useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
}
