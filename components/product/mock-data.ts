import type { MockCategory, MockDeliveryCountry, MockProduct } from '@/types';

// Централизованный мок-набор вместо "прямо в файле секции" (.claude/plans/velvety-kindling-planet.md,
// Фаза 3) — сознательное отклонение: New Arrivals и Catalog используют одни и те же товары
// (isNew-подмножество и полный список), дублировать 10 объектов в двух файлах было бы избыточно.
// Источник данных — docs/tz-pawshop.md §3.1/§3.2 (реальные названия/цены из ТЗ, не выдуманные).
export const MOCK_CATEGORIES: MockCategory[] = [
  { id: 'dry-food', slug: 'dry-food', name: 'Dry Food' },
  { id: 'wet-food', slug: 'wet-food', name: 'Wet Food' },
  { id: 'treats', slug: 'treats', name: 'Treats' },
  { id: 'accessories', slug: 'accessories', name: 'Accessories' },
];

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: '1',
    slug: 'kitten-chicken-pouches-in-jelly',
    categoryId: 'wet-food',
    name: 'Kitten Chicken Pouches in Jelly',
    description: 'Supports growth and energy',
    ageGroup: 'kitten',
    images: ['/mock/products/kitten-chicken-pouches-in-jelly.jpg'],
    isNew: true,
    price: 1.4,
    variants: [
      { id: '1-85g', label: '85 g', price: 1.4, isActive: true },
      { id: '1-pack10', label: 'Pack 10×85 g (850 g)', price: 12.9, isActive: true },
    ],
  },
  {
    id: '2',
    slug: 'kitten-chicken-milk-kibble',
    categoryId: 'dry-food',
    name: 'Kitten Chicken & Milk Kibble',
    description: 'Calcium for strong bones',
    ageGroup: 'kitten',
    images: ['/mock/products/kitten-chicken-milk-kibble.jpg'],
    isNew: false,
    price: 3.9,
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
    name: 'Salmon & Rice Kibble',
    description: 'Everyday diet',
    ageGroup: 'adult',
    images: ['/mock/products/salmon-rice-kibble.jpg'],
    isNew: true,
    price: 3.9,
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
    name: 'Beef Pouches in Gravy',
    description: 'Everyday diet',
    ageGroup: 'adult',
    images: ['/mock/products/beef-pouches-in-gravy.jpg'],
    isNew: false,
    price: 1.3,
    variants: [
      { id: '4-85g', label: '85 g', price: 1.3, isActive: true },
      { id: '4-pack10', label: 'Pack 10×85 g (850 g)', price: 11.9, isActive: true },
    ],
  },
  {
    id: '5',
    slug: 'turkey-indoor-kibble',
    categoryId: 'dry-food',
    name: 'Turkey Indoor Kibble',
    description: 'Hairball control',
    ageGroup: 'adult',
    images: ['/mock/products/turkey-indoor-kibble.jpg'],
    isNew: false,
    price: 4.3,
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
    name: 'Chicken Pouches in Jelly Senior',
    description: 'Soft, easy-to-chew texture',
    ageGroup: 'senior',
    images: ['/mock/products/chicken-pouches-in-jelly-senior.jpg'],
    isNew: false,
    price: 1.4,
    variants: [
      { id: '6-85g', label: '85 g', price: 1.4, isActive: true },
      { id: '6-pack10', label: 'Pack 10×85 g (850 g)', price: 12.9, isActive: true },
    ],
  },
  {
    id: '7',
    slug: 'salmon-kibble-senior',
    categoryId: 'dry-food',
    name: 'Salmon Kibble Senior',
    description: 'Joint support',
    ageGroup: 'senior',
    images: ['/mock/products/salmon-kibble-senior.jpg'],
    isNew: false,
    price: 4.5,
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
    name: 'Salmon Treats',
    description: 'Ideal for training and rewards',
    ageGroup: 'adult',
    images: ['/mock/products/salmon-treats.jpg'],
    isNew: true,
    price: 3.9,
    variants: [
      { id: '8-40g', label: '40 g', price: 3.9, isActive: true },
      { id: '8-pack10', label: 'Pack 10×40 g (400 g)', price: 34.9, isActive: true },
    ],
  },
  {
    id: '9',
    slug: 'cheese-cream-treats',
    categoryId: 'treats',
    name: 'Cheese & Cream Treats',
    description: 'Lickable, creamy texture',
    ageGroup: 'adult',
    images: ['/mock/products/cheese-cream-treats.jpg'],
    isNew: false,
    price: 3.2,
    variants: [
      { id: '9-40g', label: '40 g', price: 3.2, isActive: true },
      { id: '9-pack10', label: 'Pack 10×40 g (400 g)', price: 28.9, isActive: true },
    ],
  },
  {
    id: '10',
    slug: 'whisker-friendly-bowl-set',
    categoryId: 'accessories',
    name: 'Whisker-Friendly Bowl Set',
    description: 'Ceramic set with shallow, wide bowls — reduces whisker fatigue',
    ageGroup: 'adult',
    images: ['/mock/products/whisker-friendly-bowl-set.jpg'],
    isNew: false,
    price: 12.9,
    variants: [
      { id: '10-standard', label: 'Standard', price: 12.9, isActive: true },
      { id: '10-large', label: 'Large', price: 16.9, isActive: false },
    ],
  },
];

// Мок для §7.6 ТЗ (Delivery) — реальный набор заводится один раз через
// scripts/seed-delivery-countries.ts (architecture.md §3.4, п.7), здесь только для витрины на моках.
export const MOCK_DELIVERY_COUNTRIES: MockDeliveryCountry[] = [
  { id: 'de', countryName: 'Germany', price: 4.9, estimatedDays: '2–4' },
  { id: 'at', countryName: 'Austria', price: 5.9, estimatedDays: '3–5' },
  { id: 'fr', countryName: 'France', price: 7.9, estimatedDays: '3–5' },
  { id: 'nl', countryName: 'Netherlands', price: 6.9, estimatedDays: '2–4' },
  { id: 'be', countryName: 'Belgium', price: 6.9, estimatedDays: '2–4' },
  { id: 'it', countryName: 'Italy', price: 8.9, estimatedDays: '4–6' },
  { id: 'es', countryName: 'Spain', price: 9.9, estimatedDays: '4–6' },
  { id: 'pl', countryName: 'Poland', price: 6.9, estimatedDays: '3–5' },
  { id: 'cz', countryName: 'Czech Republic', price: 7.9, estimatedDays: '3–5' },
  { id: 'ie', countryName: 'Ireland', price: 10.9, estimatedDays: '4–7' },
  { id: 'se', countryName: 'Sweden', price: 11.9, estimatedDays: '4–7' },
  { id: 'dk', countryName: 'Denmark', price: 9.9, estimatedDays: '3–6' },
];

// Мок §7.3 ТЗ (getRelatedProducts) — до 4 товаров той же ageGroup, исключая сам товар; сервер
// исключит isActive: false и лимитирует до 4, здесь делаем то же самое над мок-массивом.
export function getMockRelatedProducts(product: MockProduct): MockProduct[] {
  return MOCK_PRODUCTS.filter((p) => p.id !== product.id && p.ageGroup === product.ageGroup).slice(0, 4);
}
