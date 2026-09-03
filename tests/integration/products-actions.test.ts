import { createMockCookieJar } from '@/tests/helpers/mock-next-request-apis';

const mockCookies = jest.fn();
jest.mock('next/headers', () => ({ cookies: () => mockCookies() }));

// createProduct/updateProduct/deleteProduct call revalidateTag('products', 'max') — outside a real
// Next request scope this throws ("Invariant: static generation store missing"), see
// node_modules/next/dist/server/web/spec-extension/revalidate.js.
//
// This factory replaces the whole 'next/cache' module for this file, shadowing the automatic
// __mocks__/next/cache.ts mock (an explicit jest.mock() factory always wins over it) — so
// unstable_cache must be repeated here too, or products.queries.ts (imported transitively via
// products.actions.ts -> products.service.ts) throws "unstable_cache is not a function" at import
// time, before any test body runs. Same passthrough behavior as __mocks__/next/cache.ts.
const mockRevalidateTag = jest.fn();
jest.mock('next/cache', () => ({
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
  unstable_cache: (fn: (...args: never[]) => Promise<unknown>) => fn,
}));

import { resetDb } from '@/tests/helpers/reset-db';
import { buildAdmin, buildCategory, buildProduct, buildProductVariant } from '@/tests/helpers/factories';
import { signSession } from '@/lib/auth';
import { ADMIN_SESSION_COOKIE } from '@/lib/constants';
import { createProduct, deleteProduct, getProduct } from '@/actions/products.actions';

beforeEach(async () => {
  await resetDb();
  jest.clearAllMocks();
  const admin = await buildAdmin();
  const token = await signSession({ adminId: admin.id, sessionVersion: admin.sessionVersion });
  mockCookies.mockResolvedValue(createMockCookieJar({ [ADMIN_SESSION_COOKIE]: token }));
});

// docs/architecture.md §7: deleteProduct — soft delete (isActive: false), строка остаётся в
// таблице, не физическое удаление.
describe('actions/products.actions.deleteProduct', () => {
  it('sets isActive:false and keeps the row (and its variants) in the table', async () => {
    const product = await buildProduct({ isActive: true });
    await buildProductVariant(product.id);

    const result = await deleteProduct(product.id);

    expect(result).toEqual({ success: true, data: null });
    const row = await getProduct(product.id);
    expect(row).not.toBeNull();
    expect(row!.isActive).toBe(false);
    expect(row!.variants).toHaveLength(1); // variant untouched, not cascaded away
    expect(mockRevalidateTag).toHaveBeenCalledWith('products', 'max');
  });
});

describe('actions/products.actions.createProduct', () => {
  it('rejects a product with no variants at all at the schema level, without touching the DB or revalidating', async () => {
    const category = await buildCategory();

    const result = await createProduct({
      categoryId: category.id,
      nameEn: 'No Variants',
      descriptionEn: 'desc',
      ageGroup: 'adult',
      images: ['https://example.com/a.jpg'],
      isNew: false,
      isActive: true,
      variants: [],
    });

    expect(result).toEqual({
      success: false,
      errors: { variants: 'At least one variant is required' },
    });
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it('rejects a product whose only variant is inactive (no active variant left)', async () => {
    const category = await buildCategory();

    const result = await createProduct({
      categoryId: category.id,
      nameEn: 'Only Inactive Variant',
      descriptionEn: 'desc',
      ageGroup: 'adult',
      images: ['https://example.com/a.jpg'],
      isNew: false,
      isActive: true,
      variants: [{ label: 'Size M', price: '9.99', isActive: false }],
    });

    expect(result).toEqual({
      success: false,
      errors: { root: 'At least one variant must remain active.' },
    });
  });

  it('creates the product and revalidates the products cache tag on success', async () => {
    const category = await buildCategory();

    const result = await createProduct({
      categoryId: category.id,
      nameEn: 'Fresh Kibble',
      descriptionEn: 'desc',
      ageGroup: 'adult',
      images: ['https://example.com/a.jpg'],
      isNew: false,
      isActive: true,
      variants: [{ label: 'Size M', price: '9.99', isActive: true }],
    });

    expect(result.success).toBe(true);
    expect(mockRevalidateTag).toHaveBeenCalledWith('products', 'max');
  });
});
