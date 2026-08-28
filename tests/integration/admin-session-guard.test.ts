import { createMockCookieJar } from '@/tests/helpers/mock-next-request-apis';

const mockCookies = jest.fn();
jest.mock('next/headers', () => ({ cookies: () => mockCookies() }));

import { resetDb } from '@/tests/helpers/reset-db';
import * as productsActions from '@/actions/products.actions';
import * as ordersActions from '@/actions/orders.actions';
import * as deliveryActions from '@/actions/delivery.actions';
import * as authActions from '@/actions/auth.actions';

beforeEach(async () => {
  await resetDb();
  jest.clearAllMocks();
  // Ни одной cookie в jar'е — requireAdminSession() должна отклонить любой вызов ниже независимо
  // от proxy.ts, который сюда вообще не встроен в этот тестовый прогон (docs/architecture.md §7:
  // "requireAdminSession() отклоняет вызов независимо от proxy.ts, в каждом admin action").
  mockCookies.mockResolvedValue(createMockCookieJar());
});

// Один общий helper на все admin actions (docs/architecture.md §7: "один общий test-helper на все
// admin actions, не копия проверки в каждом файле") — таблица ниже перечисляет вызов и достаточно
// мусорный, но синтаксически корректный набор аргументов; requireAdminSession() — первая строка
// тела каждого action, поэтому она обязана бросить раньше, чем аргументы вообще будут прочитаны.
async function expectRequiresAdminSession(call: () => Promise<unknown>): Promise<void> {
  await expect(call()).rejects.toThrow(/requireAdminSession/);
}

describe('every admin action rejects a request without a valid session cookie', () => {
  const cases: [string, () => Promise<unknown>][] = [
    ['products.actions.getProduct', () => productsActions.getProduct(1)],
    ['products.actions.getAdminProducts', () => productsActions.getAdminProducts()],
    ['products.actions.getProductImageUploadToken', () => productsActions.getProductImageUploadToken({})],
    ['products.actions.createProduct', () => productsActions.createProduct({})],
    ['products.actions.updateProduct', () => productsActions.updateProduct(1, {})],
    ['products.actions.deleteProduct', () => productsActions.deleteProduct(1)],
    ['orders.actions.getOrders', () => ordersActions.getOrders()],
    ['orders.actions.getOrder', () => ordersActions.getOrder(1)],
    ['orders.actions.getNewOrdersCount', () => ordersActions.getNewOrdersCount()],
    ['orders.actions.updateOrderStatus', () => ordersActions.updateOrderStatus(1, 'processing')],
    ['delivery.actions.getAdminDeliveryCountries', () => deliveryActions.getAdminDeliveryCountries()],
    ['delivery.actions.updateDeliveryCountry', () => deliveryActions.updateDeliveryCountry(1, {})],
    ['auth.actions.adminLogout', () => authActions.adminLogout()],
  ];

  it.each(cases)('%s', async (_name, call) => {
    await expectRequiresAdminSession(call);
  });
});
