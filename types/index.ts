// Моковые типы для Фазы 3 (.claude/plans/velvety-kindling-planet.md) — поля названы как будущие
// колонки Drizzle-схемы (docs/tz-pawshop.md §4), кроме `name`/`description`: здесь это уже
// зарезолвленный текст (fallback nameDe ?? nameEn применён на этапе мока), а не пара nameEn/nameDe —
// чтобы при подключении реального `getProducts()` пропсы компонентов не пришлось переписывать.
export type AgeGroup = 'kitten' | 'adult' | 'senior';

// Category — в отличие от MockProduct, оба языка обязательны сразу (CLAUDE.md, «Мультиязычность»):
// 4 категории заводятся сид-скриптом разработчиком, fallback не нужен, поэтому мок хранит nameEn/
// nameDe как есть, без предварительного резолва.
export interface MockCategory {
  id: string;
  slug: string;
  nameEn: string;
  nameDe: string;
}

export interface MockVariant {
  id: string;
  label: string;
  price: number;
  isActive: boolean;
}

export interface MockProduct {
  id: string;
  slug: string;
  categoryId: string;
  name: string;
  description: string;
  ageGroup: AgeGroup;
  images: string[];
  isNew: boolean;
  // Soft delete на уровне товара (CLAUDE.md → «База данных»): деактивация последнего активного
  // варианта запрещена в services, полное снятие с продажи идёт только через это поле. Все 10
  // моков в mock-data.ts — true; toggle в ProductTable меняет его только в локальном useState.
  isActive: boolean;
  // Уже агрегированная цена (MIN активных ProductVariant.price) — как её вернёт будущий
  // getProducts()/getProductBySlug() (architecture.md: агрегат считается в SQL, не в компоненте).
  // Инвариант мока: всегда равна цене первого active-варианта в `variants` (см. mock-data.ts) —
  // держим синхронно вручную, реальный getProducts() будет считать это агрегатом в SQL.
  price: number;
  variants: MockVariant[];
}

export interface MockDeliveryCountry {
  id: string;
  countryName: string;
  price: number;
  estimatedDays: string;
}

export type OrderStatus = 'new' | 'processing' | 'done' | 'cancelled';

// OrderItem — снапшот на момент заказа (tz-pawshop.md §4): собственные name/label/price полей,
// не ссылка на текущий MockProduct/MockVariant — правка товара в ProductTable не должна задним
// числом менять то, что видел клиент в уже оформленном заказе.
export interface MockOrderItem {
  id: string;
  productNameAtOrder: string;
  variantLabelAtOrder: string;
  quantity: number;
  priceAtOrder: number;
}

export interface MockOrder {
  id: string;
  customerName: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  // Снапшот DeliveryCountry.countryName, не FK на MockDeliveryCountry — тот же принцип, что у
  // OrderItem выше (architecture.md: Order.deliveryCountryId nullable + snapshot полей).
  countryName: string;
  shippingPriceAtOrder: number;
  comment: string | null;
  status: OrderStatus;
  createdAt: string;
  items: MockOrderItem[];
}
