import type { MockCategory, MockDeliveryCountry, MockProduct } from '@/types';

// Централизованный мок-набор вместо "прямо в файле секции" (.claude/plans/velvety-kindling-planet.md,
// Фаза 3) — сознательное отклонение: New Arrivals и Catalog используют одни и те же товары
// (isNew-подмножество и полный список), дублировать 10 объектов в двух файлах было бы избыточно.
// Источник данных — docs/tz-pawshop.md §3.1/§3.2 (реальные названия/цены из ТЗ, не выдуманные).
export const MOCK_CATEGORIES: MockCategory[] = [
  { id: 'dry-food', slug: 'dry-food', nameEn: 'Dry food', nameDe: 'Trockenfutter' },
  { id: 'wet-food', slug: 'wet-food', nameEn: 'Wet food', nameDe: 'Nassfutter' },
  { id: 'treats', slug: 'treats', nameEn: 'Treats', nameDe: 'Leckerlis' },
  { id: 'accessories', slug: 'accessories', nameEn: 'Accessories', nameDe: 'Zubehör' },
];

type MockProductInput = Omit<MockProduct, 'price'>;

// price — MIN(active ProductVariant.price), тот же агрегат, что будущий getProducts() посчитает в
// SQL (CLAUDE.md → «База данных»). Раньше это было отдельное поле, которое приходилось вручную
// держать синхронным с variants (types/index.ts хранил инвариант как комментарий — реального
// гаранта не было: список вариантов не обязан быть отсортирован по цене, и "первый active" мог
// разойтись с фактическим минимумом). Теперь считается один раз при построении MOCK_PRODUCTS —
// разойтись физически не может. Math.min(...[]) даёт Infinity, если у товара нет ни одного
// activePrice — здесь это не проверяется намеренно: CLAUDE.md → «База данных» запрещает
// деактивацию последнего активного варианта на уровне services, так что каждый MOCK_PRODUCT_INPUTS
// обязан всегда содержать хотя бы один isActive-вариант как входной инвариант, а не runtime-случай.
function withComputedPrice(product: MockProductInput): MockProduct {
  const activePrices = product.variants
    .filter((variant) => variant.isActive)
    .map((variant) => variant.price);
  return { ...product, price: Math.min(...activePrices) };
}

const MOCK_PRODUCT_INPUTS: MockProductInput[] = [
  {
    id: '1',
    slug: 'kitten-chicken-pouches-in-jelly',
    categoryId: 'wet-food',
    name: 'Kitten chicken pouches in jelly',
    description: 'Supports growth and energy',
    composition:
      'Chicken (min. 40%), chicken broth, jelly (thickener: guar gum), minerals, vitamins A, D3, E, taurine.',
    analyticalConstituents: 'Protein 10%, Fat 3%, Fibre 0.5%, Ash 2%, Moisture 82%.',
    ageGroup: 'kitten',
    images: ['/mock/products/kitten-chicken-pouches-in-jelly.jpg'],
    isNew: true,
    isActive: true,
    variants: [
      { id: '1-85g', label: '85 g', price: 1.4, isActive: true },
      { id: '1-pack10', label: 'Pack 10×85 g (850 g)', price: 12.9, isActive: true },
    ],
  },
  {
    id: '2',
    slug: 'kitten-chicken-milk-kibble',
    categoryId: 'dry-food',
    name: 'Kitten chicken & milk kibble',
    description: 'Calcium for strong bones',
    composition:
      'Chicken meal (min. 32%), rice, milk powder (4%), animal fat, calcium carbonate, vitamins A, D3, E, taurine.',
    analyticalConstituents: 'Protein 34%, Fat 16%, Fibre 2%, Ash 7%, Moisture 8%.',
    ageGroup: 'kitten',
    images: ['/mock/products/kitten-chicken-milk-kibble.jpg'],
    isNew: false,
    isActive: true,
    variants: [
      { id: '2-300g', label: '300 g', price: 3.9, isActive: true },
      { id: '2-1_2kg', label: '1.2 kg', price: 14.3, isActive: true },
      { id: '2-3kg', label: '3 kg', price: 32.9, isActive: true },
    ],
  },
  {
    id: '3',
    slug: 'salmon-rice-kibble',
    categoryId: 'dry-food',
    name: 'Salmon & rice kibble',
    description: 'Everyday diet',
    composition:
      'Salmon meal (min. 30%), rice, salmon oil (3%), minerals, vitamins A, D3, E, taurine.',
    analyticalConstituents: 'Protein 32%, Fat 15%, Fibre 2.5%, Ash 7%, Moisture 8%.',
    ageGroup: 'adult',
    images: ['/mock/products/salmon-rice-kibble.jpg'],
    isNew: true,
    isActive: true,
    variants: [
      { id: '3-300g', label: '300 g', price: 3.9, isActive: true },
      { id: '3-1_2kg', label: '1.2 kg', price: 14.3, isActive: true },
      { id: '3-3kg', label: '3 kg', price: 32.9, isActive: true },
    ],
  },
  {
    id: '4',
    slug: 'beef-pouches-in-gravy',
    categoryId: 'wet-food',
    name: 'Beef pouches in gravy',
    description: 'Everyday diet',
    composition:
      'Beef (min. 40%), beef broth, gravy (thickener: guar gum), minerals, vitamins A, D3, E, taurine.',
    analyticalConstituents: 'Protein 9%, Fat 3.5%, Fibre 0.5%, Ash 2%, Moisture 82%.',
    ageGroup: 'adult',
    images: ['/mock/products/beef-pouches-in-gravy.jpg'],
    isNew: false,
    isActive: true,
    variants: [
      { id: '4-85g', label: '85 g', price: 1.3, isActive: true },
      { id: '4-pack10', label: 'Pack 10×85 g (850 g)', price: 11.9, isActive: true },
    ],
  },
  {
    id: '5',
    slug: 'turkey-indoor-kibble',
    categoryId: 'dry-food',
    name: 'Turkey indoor kibble',
    description: 'Hairball control',
    composition:
      'Turkey meal (min. 30%), rice, beet pulp (fibre, 4%), poultry fat, minerals, vitamins A, D3, E, taurine.',
    analyticalConstituents: 'Protein 30%, Fat 12%, Fibre 4%, Ash 7%, Moisture 8%.',
    ageGroup: 'adult',
    images: ['/mock/products/turkey-indoor-kibble.jpg'],
    isNew: false,
    isActive: true,
    variants: [
      { id: '5-300g', label: '300 g', price: 4.3, isActive: true },
      { id: '5-1_2kg', label: '1.2 kg', price: 15.9, isActive: true },
      // isActive: false — единственный намеренно "распроданный" вариант в моках, демонстрирует
      // состояние variant-chip-disabled ("Out of stock") на странице товара (design.md → Components).
      { id: '5-3kg', label: '3 kg', price: 36.9, isActive: false },
    ],
  },
  {
    id: '6',
    slug: 'chicken-pouches-in-jelly-senior',
    categoryId: 'wet-food',
    name: 'Chicken pouches in jelly senior',
    description: 'Soft, easy-to-chew texture',
    composition:
      'Chicken (min. 38%), chicken broth, jelly (thickener: guar gum), minerals, vitamins A, D3, E, taurine.',
    analyticalConstituents: 'Protein 9%, Fat 3%, Fibre 0.5%, Ash 2%, Moisture 82%.',
    ageGroup: 'senior',
    images: ['/mock/products/chicken-pouches-in-jelly-senior.jpg'],
    isNew: false,
    isActive: true,
    variants: [
      { id: '6-85g', label: '85 g', price: 1.4, isActive: true },
      { id: '6-pack10', label: 'Pack 10×85 g (850 g)', price: 12.9, isActive: true },
    ],
  },
  {
    id: '7',
    slug: 'salmon-kibble-senior',
    categoryId: 'dry-food',
    name: 'Salmon kibble senior',
    description: 'Joint support',
    composition:
      'Salmon meal (min. 28%), rice, salmon oil (3%), glucosamine, chondroitin, minerals, vitamins A, D3, E, taurine.',
    analyticalConstituents: 'Protein 30%, Fat 13%, Fibre 3%, Ash 7%, Moisture 8%.',
    ageGroup: 'senior',
    images: ['/mock/products/salmon-kibble-senior.jpg'],
    isNew: false,
    isActive: true,
    variants: [
      { id: '7-300g', label: '300 g', price: 4.5, isActive: true },
      { id: '7-1_2kg', label: '1.2 kg', price: 16.5, isActive: true },
      { id: '7-3kg', label: '3 kg', price: 37.9, isActive: true },
    ],
  },
  {
    id: '8',
    slug: 'salmon-treats',
    categoryId: 'treats',
    name: 'Salmon treats',
    description: 'Ideal for training and rewards',
    composition: '100% freeze-dried salmon fillet — single ingredient, no additives.',
    analyticalConstituents: 'Protein 80%, Fat 8%, Fibre 1%, Ash 6%, Moisture 5%.',
    ageGroup: 'adult',
    images: ['/mock/products/salmon-treats.jpg'],
    isNew: true,
    isActive: true,
    variants: [
      { id: '8-40g', label: '40 g', price: 3.9, isActive: true },
      { id: '8-pack10', label: 'Pack 10×40 g (400 g)', price: 34.9, isActive: true },
    ],
  },
  {
    id: '9',
    slug: 'cheese-cream-treats',
    categoryId: 'treats',
    name: 'Cheese & cream treats',
    description: 'Lickable, creamy texture',
    composition: 'Cheese (28%), cream (12%), wheat flour, vitamins A, D3, E.',
    analyticalConstituents: 'Protein 15%, Fat 20%, Fibre 0.5%, Ash 3%, Moisture 20%.',
    ageGroup: 'adult',
    images: ['/mock/products/cheese-cream-treats.jpg'],
    isNew: false,
    isActive: true,
    variants: [
      { id: '9-40g', label: '40 g', price: 3.2, isActive: true },
      { id: '9-pack10', label: 'Pack 10×40 g (400 g)', price: 28.9, isActive: true },
    ],
  },
  {
    id: '10',
    slug: 'whisker-friendly-bowl-set',
    categoryId: 'accessories',
    name: 'Whisker-friendly bowl set',
    description: 'Ceramic set with shallow, wide bowls — reduces whisker fatigue',
    // Не еда — Composition/Analytical constituents на странице товара не рендерятся вовсе
    // (см. ProductDetailClient.tsx).
    composition: null,
    analyticalConstituents: null,
    ageGroup: 'adult',
    images: ['/mock/products/whisker-friendly-bowl-set.jpg'],
    isNew: false,
    isActive: true,
    variants: [
      { id: '10-standard', label: 'Standard', price: 12.9, isActive: true },
      { id: '10-large', label: 'Large', price: 16.9, isActive: false },
    ],
  },
];

export const MOCK_PRODUCTS: MockProduct[] = MOCK_PRODUCT_INPUTS.map(withComputedPrice);

// Мок для §7.6 ТЗ (Delivery) — реальный набор заводится один раз через
// scripts/seed-delivery-countries.ts (architecture.md §3.4, п.7), здесь только для витрины на моках.
export const MOCK_DELIVERY_COUNTRIES: MockDeliveryCountry[] = [
  { id: 'de', countryName: 'Germany', price: 4.9, estimatedDays: '2–4', isActive: true },
  { id: 'at', countryName: 'Austria', price: 5.9, estimatedDays: '3–5', isActive: true },
  { id: 'fr', countryName: 'France', price: 7.9, estimatedDays: '3–5', isActive: true },
  { id: 'nl', countryName: 'Netherlands', price: 6.9, estimatedDays: '2–4', isActive: true },
  { id: 'be', countryName: 'Belgium', price: 6.9, estimatedDays: '2–4', isActive: true },
  { id: 'it', countryName: 'Italy', price: 8.9, estimatedDays: '4–6', isActive: true },
  { id: 'es', countryName: 'Spain', price: 9.9, estimatedDays: '4–6', isActive: true },
  { id: 'pl', countryName: 'Poland', price: 6.9, estimatedDays: '3–5', isActive: true },
  { id: 'cz', countryName: 'Czech Republic', price: 7.9, estimatedDays: '3–5', isActive: true },
  { id: 'ie', countryName: 'Ireland', price: 10.9, estimatedDays: '4–7', isActive: true },
  { id: 'se', countryName: 'Sweden', price: 11.9, estimatedDays: '4–7', isActive: true },
  { id: 'dk', countryName: 'Denmark', price: 9.9, estimatedDays: '3–6', isActive: true },
];

// Мок §7.3 ТЗ (getRelatedProducts) — до 4 товаров той же ageGroup, исключая сам товар; сервер
// исключит isActive: false и лимитирует до 4, здесь делаем то же самое над мок-массивом.
export function getMockRelatedProducts(product: MockProduct): MockProduct[] {
  return MOCK_PRODUCTS.filter((p) => p.id !== product.id && p.ageGroup === product.ageGroup).slice(
    0,
    4,
  );
}
