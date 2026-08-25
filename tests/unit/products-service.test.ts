// lib/services/products.service.ts вызывает products.queries.ts (БД) и vercel-blob.provider.ts
// (сеть) напрямую — юнит-тест бизнес-правил самого сервиса, не integration-тест против реальной
// БД/Blob, поэтому обе зависимости мокаются, тот же приём, что в tests/unit/auth-service.test.ts
// (explicit factory — без неё автомок сначала требует оригинальный products.queries.ts, а тот
// тянет lib/db/index.ts, который на уровне модуля падает без DATABASE_URL).
jest.mock('@/lib/db/queries/products.queries', () => ({
  createProductWithVariants: jest.fn(),
  getProduct: jest.fn(),
  getProductBySlug: jest.fn(),
  getProducts: jest.fn(),
  getRelatedProducts: jest.fn(),
  setProductActive: jest.fn(),
  slugExists: jest.fn(),
  updateProductWithVariants: jest.fn(),
}));
jest.mock('@/lib/storage/vercel-blob.provider', () => ({
  vercelBlobProvider: { createUploadToken: jest.fn(), delete: jest.fn() },
}));

import type { ProductInput } from '@/lib/validation/product.schema';

type ProductsQueriesModule = typeof import('@/lib/db/queries/products.queries');
type StorageModule = typeof import('@/lib/storage/vercel-blob.provider');
type ProductsServiceModule = typeof import('@/lib/services/products.service');

let queries: jest.Mocked<ProductsQueriesModule>;
let storage: { vercelBlobProvider: jest.Mocked<StorageModule['vercelBlobProvider']> };
let productsService: ProductsServiceModule;

beforeAll(async () => {
  queries = jest.requireMock('@/lib/db/queries/products.queries');
  storage = jest.requireMock('@/lib/storage/vercel-blob.provider');
  productsService = await import('@/lib/services/products.service');
});

beforeEach(() => {
  jest.clearAllMocks();
});

const VALID_VARIANT = { label: '300 g', price: '12.90', isActive: true };

// CLAUDE.md → «База данных»: товар без фото/варианта не сохраняется — базовый валидный input,
// каждый тест ниже портит ровно одно поле.
const BASE_INPUT: ProductInput = {
  categoryId: 1,
  nameEn: 'Salmon pouches',
  nameDe: null,
  descriptionEn: 'Wet food for adult cats.',
  descriptionDe: null,
  composition: null,
  analyticalConstituents: null,
  flavor: 'Salmon',
  ageGroup: 'adult',
  images: ['https://example.public.blob.vercel-storage.com/a.jpg'],
  isNew: false,
  isActive: true,
  variants: [VALID_VARIANT],
};

describe('products.service.createProduct — save guards', () => {
  it('rejects a product without a single photo, without touching the database', async () => {
    const result = await productsService.createProduct({ ...BASE_INPUT, images: [] });

    expect(result).toEqual({ success: false, error: 'missing_photo' });
    expect(queries.slugExists).not.toHaveBeenCalled();
    expect(queries.createProductWithVariants).not.toHaveBeenCalled();
  });

  it('rejects a product without a single variant', async () => {
    const result = await productsService.createProduct({ ...BASE_INPUT, variants: [] });

    expect(result).toEqual({ success: false, error: 'missing_variant' });
    expect(queries.createProductWithVariants).not.toHaveBeenCalled();
  });

  it('rejects a product whose variants are all inactive — catalog price would be NULL otherwise', async () => {
    const result = await productsService.createProduct({
      ...BASE_INPUT,
      variants: [{ ...VALID_VARIANT, isActive: false }],
    });

    expect(result).toEqual({ success: false, error: 'no_active_variant' });
    expect(queries.createProductWithVariants).not.toHaveBeenCalled();
  });

  it('saves a valid product and returns the generated id', async () => {
    queries.slugExists.mockResolvedValue(false);
    queries.createProductWithVariants.mockResolvedValue(42);

    const result = await productsService.createProduct(BASE_INPUT);

    expect(result).toEqual({ success: true, data: { id: 42 } });
    expect(queries.createProductWithVariants).toHaveBeenCalledTimes(1);
  });
});

describe('products.service.updateProduct — save guards', () => {
  it('rejects deactivating the last active variant on an existing product', async () => {
    const result = await productsService.updateProduct(1, {
      ...BASE_INPUT,
      variants: [{ id: 10, ...VALID_VARIANT, isActive: false }],
    });

    expect(result).toEqual({ success: false, error: 'no_active_variant' });
    expect(queries.updateProductWithVariants).not.toHaveBeenCalled();
    expect(queries.getProduct).not.toHaveBeenCalled();
  });

  it('rejects clearing all photos on an existing product', async () => {
    const result = await productsService.updateProduct(1, { ...BASE_INPUT, images: [] });

    expect(result).toEqual({ success: false, error: 'missing_photo' });
    expect(queries.updateProductWithVariants).not.toHaveBeenCalled();
  });
});

describe('products.service.updateProduct — Blob cleanup on photo replacement (architecture.md §3.5)', () => {
  const OLD_URL_A = 'https://example.public.blob.vercel-storage.com/old-a.jpg';
  const OLD_URL_B = 'https://example.public.blob.vercel-storage.com/old-b.jpg';
  const NEW_URL = 'https://example.public.blob.vercel-storage.com/new.jpg';

  beforeEach(() => {
    queries.getProduct.mockResolvedValue({
      id: 1,
      slug: 'salmon-pouches',
      categoryId: 1,
      nameEn: BASE_INPUT.nameEn,
      nameDe: null,
      descriptionEn: BASE_INPUT.descriptionEn,
      descriptionDe: null,
      composition: null,
      analyticalConstituents: null,
      flavor: null,
      ageGroup: 'adult',
      images: [OLD_URL_A, OLD_URL_B],
      isNew: false,
      isActive: true,
      createdAt: new Date(),
      variants: [{ id: 10, ...VALID_VARIANT }],
    });
    storage.vercelBlobProvider.delete.mockResolvedValue(undefined);
  });

  it('deletes only the photo URLs that were dropped from images[], not the ones kept', async () => {
    await productsService.updateProduct(1, { ...BASE_INPUT, images: [OLD_URL_A, NEW_URL] });

    expect(storage.vercelBlobProvider.delete).toHaveBeenCalledTimes(1);
    expect(storage.vercelBlobProvider.delete).toHaveBeenCalledWith(OLD_URL_B);
  });

  it('does not call delete at all when the image set is unchanged', async () => {
    await productsService.updateProduct(1, { ...BASE_INPUT, images: [OLD_URL_A, OLD_URL_B] });

    expect(storage.vercelBlobProvider.delete).not.toHaveBeenCalled();
  });

  it('does not throw when Blob deletion fails — orphan file is acceptable, a broken save is not', async () => {
    storage.vercelBlobProvider.delete.mockRejectedValue(new Error('Blob unreachable'));

    const result = await productsService.updateProduct(1, { ...BASE_INPUT, images: [NEW_URL] });

    expect(result).toEqual({ success: true });
  });
});
