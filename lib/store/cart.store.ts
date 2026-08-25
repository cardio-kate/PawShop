import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Снапшот на момент добавления (name/image/variantLabel/price), не только id — тот же принцип, что
// у OrderItem (priceAtOrder/productNameAtOrder/variantLabelAtOrder, lib/db/schema.ts): корзина не
// умеет заново искать товар по id (в ТЗ §5 нет action под это, только getProducts/getProductBySlug/
// getRelatedProducts), поэтому берёт всё нужное для отображения сразу из уже загруженного товара в
// момент клика "Add to Cart". Актуальность (удалён/деактивирован ли товар с тех пор) всё равно
// перепроверяется только на сервере при createOrder (CLAUDE.md → «Заказ и корзина») — клиентская
// корзина не обязана знать об этом заранее.
interface CartItem {
  productId: number;
  variantId: number;
  quantity: number;
  productName: string;
  productSlug: string;
  productImage: string;
  variantLabel: string;
  price: string; // numeric(10,2) как строка — тот же формат, что Product/ProductVariant.price в БД
}

export interface AddCartItemInput {
  productId: number;
  variantId: number;
  productName: string;
  productSlug: string;
  productImage: string;
  variantLabel: string;
  price: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: AddCartItemInput, quantity?: number) => void;
  removeItem: (productId: number, variantId: number) => void;
  updateQuantity: (productId: number, variantId: number, quantity: number) => void;
  clearCart: () => void;
}

function isSameLine(item: CartItem, productId: number, variantId: number): boolean {
  return item.productId === productId && item.variantId === variantId;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [] as CartItem[],
      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((line) =>
            isSameLine(line, item.productId, item.variantId),
          );
          if (existing) {
            return {
              items: state.items.map((line) =>
                line === existing ? { ...line, quantity: line.quantity + quantity } : line,
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
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
      // Вызывается только после успешного ответа createOrder (CLAUDE.md → «Заказ и корзина»), не
      // оптимистично по клику "Place Order" — CheckoutClient не должен опустошать корзину, если
      // сервер ещё не подтвердил заказ.
      clearCart: () => set({ items: [] }),
    }),
    // skipHydration: сервер не знает содержимое localStorage — без этого флага первый клиентский
    // рендер мог бы разойтись с серверным (hydration mismatch) + видимое моргание 0 → N на
    // счётчике корзины в Header. Гидратация запускается вручную (см. Header.tsx) уже после маунта.
    //
    // version/migrate: строки, сохранённые до перехода на снапшот (productId/variantId были
    // строковыми mock-id, без name/image/price), не совпадают с текущей формой CartItem — без
    // явной миграции item.variant.price оказывается undefined и роняет lib/money.ts на
    // .trim() у любого браузера, где в localStorage осталась старая корзина. Реконструировать
    // снапшот из старых данных нечем (в них не было ни цены, ни названия) — версия 0 → 1 просто
    // очищает корзину, это честнее молчаливого краша.
    {
      name: 'pawshop-cart',
      skipHydration: true,
      version: 1,
      migrate: () => ({ items: [] }),
    },
  ),
);
