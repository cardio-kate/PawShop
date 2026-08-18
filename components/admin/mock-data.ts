import type { MockOrder } from '@/types';

// Отдельный файл от components/product/mock-data.ts: Order — чисто admin-сущность, ни один
// storefront-компонент его не потребляет (в отличие от MOCK_PRODUCTS/MOCK_CATEGORIES, общих для
// каталога и ProductTable). Товары/варианты внутри items — снапшоты (productNameAtOrder и т.д.,
// см. types/index.ts), не ссылки на MOCK_PRODUCTS, поэтому не импортируются оттуда.
export const MOCK_ORDERS: MockOrder[] = [
  {
    id: '1024',
    customerName: 'Lena Fischer',
    phone: '+49 151 2345678',
    street: 'Musterstraße 12',
    city: 'Berlin',
    postalCode: '10115',
    countryName: 'Germany',
    shippingPriceAtOrder: 4.9,
    comment: 'Please leave at the door if no one answers.',
    status: 'new',
    createdAt: '2026-08-15T09:20:00.000Z',
    items: [
      {
        id: '1024-1',
        productNameAtOrder: 'Kitten chicken pouches in jelly',
        variantLabelAtOrder: 'Pack 10×85 g (850 g)',
        quantity: 2,
        priceAtOrder: 12.9,
      },
      {
        id: '1024-2',
        productNameAtOrder: 'Salmon & rice kibble',
        variantLabelAtOrder: '1.2 kg',
        quantity: 1,
        priceAtOrder: 14.3,
      },
    ],
  },
  {
    id: '1023',
    customerName: 'Tom Novak',
    phone: '+43 664 1122334',
    street: 'Hauptplatz 5',
    city: 'Vienna',
    postalCode: '1010',
    countryName: 'Austria',
    shippingPriceAtOrder: 5.9,
    comment: null,
    status: 'new',
    createdAt: '2026-08-15T07:05:00.000Z',
    items: [
      {
        id: '1023-1',
        productNameAtOrder: 'Whisker-friendly bowl set',
        variantLabelAtOrder: 'Standard',
        quantity: 1,
        priceAtOrder: 12.9,
      },
    ],
  },
  {
    id: '1022',
    customerName: 'Marie Dubois',
    phone: '+33 6 12 34 56 78',
    street: 'Rue de Paris 8',
    city: 'Lyon',
    postalCode: '69001',
    countryName: 'France',
    shippingPriceAtOrder: 7.9,
    comment: 'Gift wrap if possible.',
    status: 'processing',
    createdAt: '2026-08-14T16:40:00.000Z',
    items: [
      {
        id: '1022-1',
        productNameAtOrder: 'Salmon treats',
        variantLabelAtOrder: 'Pack 10×40 g (400 g)',
        quantity: 1,
        priceAtOrder: 34.9,
      },
      {
        id: '1022-2',
        productNameAtOrder: 'Cheese & cream treats',
        variantLabelAtOrder: '40 g',
        quantity: 3,
        priceAtOrder: 3.2,
      },
    ],
  },
  {
    id: '1021',
    customerName: 'Jan de Vries',
    phone: '+31 6 1234 5678',
    street: 'Kerkstraat 22',
    city: 'Amsterdam',
    postalCode: '1017',
    countryName: 'Netherlands',
    shippingPriceAtOrder: 6.9,
    comment: null,
    status: 'done',
    createdAt: '2026-08-12T11:15:00.000Z',
    items: [
      {
        id: '1021-1',
        productNameAtOrder: 'Turkey indoor kibble',
        variantLabelAtOrder: '3 kg',
        quantity: 1,
        priceAtOrder: 36.9,
      },
    ],
  },
  {
    id: '1020',
    customerName: 'Sofia Rossi',
    phone: '+39 320 1234567',
    street: 'Via Roma 14',
    city: 'Milan',
    postalCode: '20121',
    countryName: 'Italy',
    shippingPriceAtOrder: 8.9,
    comment: null,
    status: 'cancelled',
    createdAt: '2026-08-10T13:50:00.000Z',
    items: [
      {
        id: '1020-1',
        productNameAtOrder: 'Beef pouches in gravy',
        variantLabelAtOrder: 'Pack 10×85 g (850 g)',
        quantity: 1,
        priceAtOrder: 11.9,
      },
    ],
  },
  {
    id: '1019',
    customerName: 'Katarzyna Wójcik',
    phone: '+48 512 345 678',
    street: 'Kwiatowa 3',
    city: 'Kraków',
    postalCode: '30-001',
    countryName: 'Poland',
    shippingPriceAtOrder: 6.9,
    comment: 'Call before delivery.',
    status: 'done',
    createdAt: '2026-08-08T08:30:00.000Z',
    items: [
      {
        id: '1019-1',
        productNameAtOrder: 'Salmon kibble senior',
        variantLabelAtOrder: '1.2 kg',
        quantity: 1,
        priceAtOrder: 16.5,
      },
      {
        id: '1019-2',
        productNameAtOrder: 'Chicken pouches in jelly senior',
        variantLabelAtOrder: '85 g',
        quantity: 4,
        priceAtOrder: 1.4,
      },
    ],
  },
];

// Вынесено отдельно от getMockOrderTotal — OrderDetail.tsx показывает Subtotal отдельной строкой
// над Total и раньше пересчитывал ту же сумму вторым независимым reduce по order.items.
export function getMockOrderSubtotal(order: MockOrder): number {
  return order.items.reduce((sum, item) => sum + item.priceAtOrder * item.quantity, 0);
}

export function getMockOrderTotal(order: MockOrder): number {
  return getMockOrderSubtotal(order) + order.shippingPriceAtOrder;
}
