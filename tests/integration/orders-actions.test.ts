import { createMockHeaders } from '@/tests/helpers/mock-next-request-apis';

// createOrder (public action) → orders.service.createOrder → lib/rate-limit.checkRateLimit()
// reads next/headers.headers() — needs mocking outside a real request scope (docs/architecture.md §7).
const mockHeaders = jest.fn();
jest.mock('next/headers', () => ({ headers: () => mockHeaders() }));

// CLAUDE.md → «Тесты»: lib/telegram.ts всегда jest.mock, на обоих уровнях — тест не имеет права
// стучаться в реальный Telegram API.
jest.mock('@/lib/telegram');

import { resetDb } from '@/tests/helpers/reset-db';
import {
  buildProduct,
  buildProductVariant,
  buildDeliveryCountry,
  buildAdmin,
} from '@/tests/helpers/factories';
import { createOrder } from '@/actions/orders.actions';
import { getOrder } from '@/lib/db/queries/orders.queries';
import * as telegram from '@/lib/telegram';
import { RATE_LIMIT_MAX_REQUESTS } from '@/lib/constants';

const mockedTelegram = jest.mocked(telegram);

let ipCounter = 0;
function setFreshClientIp() {
  ipCounter += 1;
  mockHeaders.mockResolvedValue(createMockHeaders({ 'x-forwarded-for': `198.51.100.${ipCounter}` }));
}

beforeEach(async () => {
  await resetDb();
  jest.clearAllMocks();
  setFreshClientIp();
});

const BASE_ADDRESS = {
  customerName: 'Jane Doe',
  phone: '+491234567',
  street: 'Main St 1',
  city: 'Berlin',
  postalCode: '10115',
  comment: '',
  // order.schema.ts: consent checkbox added to the checkout form, required on every createOrder
  // call now (not persisted — see the comment there for why).
  agreesToPrivacyPolicy: true as const,
};

describe('actions/orders.actions.createOrder — happy path', () => {
  it('creates the order, recalculates the total from DB prices, and notifies the configured admin', async () => {
    await buildAdmin({ telegramChatId: '999' });
    const product = await buildProduct();
    const variant = await buildProductVariant(product.id, { price: '10.00' });
    const country = await buildDeliveryCountry({ price: '5.00' });

    const result = await createOrder({
      ...BASE_ADDRESS,
      deliveryCountryId: country.id,
      items: [{ productId: product.id, variantId: variant.id, quantity: 2 }],
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.unavailableCount).toBe(0);

    const order = await getOrder(result.data.id);
    expect(order!.items).toHaveLength(1);
    expect(order!.items[0]!.quantity).toBe(2);
    expect(order!.items[0]!.priceAtOrder).toBe('10.00'); // из БД, не из клиента
    expect(order!.shippingPriceAtOrder).toBe('5.00');

    expect(mockedTelegram.sendOrderNotification).toHaveBeenCalledTimes(1);
    const [chatId] = mockedTelegram.sendOrderNotification.mock.calls[0]!;
    expect(chatId).toBe('999');
  });

  it('does not throw and still creates the order when the Telegram call itself fails', async () => {
    await buildAdmin({ telegramChatId: '999' });
    mockedTelegram.sendOrderNotification.mockRejectedValue(new Error('Telegram unreachable'));
    const product = await buildProduct();
    const variant = await buildProductVariant(product.id);
    const country = await buildDeliveryCountry();

    const result = await createOrder({
      ...BASE_ADDRESS,
      deliveryCountryId: country.id,
      items: [{ productId: product.id, variantId: variant.id, quantity: 1 }],
    });

    expect(result.success).toBe(true);
  });
});

describe('actions/orders.actions.createOrder — unavailable items', () => {
  it('excludes a deactivated variant, reports unavailableCount, and still creates the order for the rest', async () => {
    await buildAdmin({ telegramChatId: '999' });
    const product = await buildProduct();
    const availableVariant = await buildProductVariant(product.id, { price: '10.00' });
    const unavailableVariant = await buildProductVariant(product.id, { isActive: false });
    const country = await buildDeliveryCountry();

    const result = await createOrder({
      ...BASE_ADDRESS,
      deliveryCountryId: country.id,
      items: [
        { productId: product.id, variantId: availableVariant.id, quantity: 1 },
        { productId: product.id, variantId: unavailableVariant.id, quantity: 1 },
      ],
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.unavailableCount).toBe(1);

    const order = await getOrder(result.data.id);
    expect(order!.items).toHaveLength(1);
    expect(order!.items[0]!.variantId).toBe(availableVariant.id);
  });

  it('rejects the whole order with no_available_items when every item is unavailable, without creating an Order row', async () => {
    const product = await buildProduct();
    const unavailableVariant = await buildProductVariant(product.id, { isActive: false });
    const country = await buildDeliveryCountry();

    const result = await createOrder({
      ...BASE_ADDRESS,
      deliveryCountryId: country.id,
      items: [{ productId: product.id, variantId: unavailableVariant.id, quantity: 1 }],
    });

    expect(result).toEqual({
      success: false,
      errors: { root: 'errors.noAvailableItems' },
    });
  });
});

describe('actions/orders.actions.createOrder — invalid delivery country', () => {
  it('rejects an unknown deliveryCountryId', async () => {
    const product = await buildProduct();
    const variant = await buildProductVariant(product.id);

    const result = await createOrder({
      ...BASE_ADDRESS,
      deliveryCountryId: 999999,
      items: [{ productId: product.id, variantId: variant.id, quantity: 1 }],
    });

    expect(result).toEqual({
      success: false,
      errors: { deliveryCountryId: 'errors.country.invalid' },
    });
  });

  it('rejects a deactivated delivery country', async () => {
    const product = await buildProduct();
    const variant = await buildProductVariant(product.id);
    const country = await buildDeliveryCountry({ isActive: false });

    const result = await createOrder({
      ...BASE_ADDRESS,
      deliveryCountryId: country.id,
      items: [{ productId: product.id, variantId: variant.id, quantity: 1 }],
    });

    expect(result).toEqual({
      success: false,
      errors: { deliveryCountryId: 'errors.country.invalid' },
    });
  });
});

describe('actions/orders.actions.createOrder — rate limit', () => {
  it('blocks createOrder once the shared per-IP budget is exhausted', async () => {
    const country = await buildDeliveryCountry({ isActive: false }); // fails fast (invalid_country), no order/Telegram noise
    const input = {
      ...BASE_ADDRESS,
      deliveryCountryId: country.id,
      items: [{ productId: 1, variantId: 1, quantity: 1 }],
    };

    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      const result = await createOrder(input);
      expect(result).toEqual({ success: false, errors: { deliveryCountryId: 'errors.country.invalid' } });
    }

    const blocked = await createOrder(input);

    expect(blocked).toEqual({ success: false, errors: { root: 'errors.rateLimited' } });
  });
});
