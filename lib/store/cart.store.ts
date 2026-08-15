import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (productId: string, variantId: string, quantity?: number) => void;
  removeItem: (productId: string, variantId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
}

function isSameLine(item: CartItem, productId: string, variantId: string): boolean {
  return item.productId === productId && item.variantId === variantId;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [] as CartItem[],
      addItem: (productId, variantId, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((item) => isSameLine(item, productId, variantId));
          if (existing) {
            return {
              items: state.items.map((item) =>
                item === existing ? { ...item, quantity: item.quantity + quantity } : item,
              ),
            };
          }
          return { items: [...state.items, { productId, variantId, quantity }] };
        }),
      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter((item) => !isSameLine(item, productId, variantId)),
        })),
      // quantity <= 0 удаляет позицию — тот же путь, что явное удаление, чтобы степпер CartItem
      // мог просто декрементировать без отдельной ветки "дошли до нуля" на стороне компонента.
      updateQuantity: (productId, variantId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => !isSameLine(item, productId, variantId))
              : state.items.map((item) =>
                  isSameLine(item, productId, variantId) ? { ...item, quantity } : item,
                ),
        })),
    }),
    // skipHydration: сервер не знает содержимое localStorage — без этого флага первый клиентский
    // рендер мог бы разойтись с серверным (hydration mismatch) + видимое моргание 0 → N на
    // счётчике корзины в Header. Гидратация запускается вручную (см. Header.tsx) уже после маунта.
    { name: 'pawshop-cart', skipHydration: true },
  ),
);
