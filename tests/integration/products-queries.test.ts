import { resetDb } from '@/tests/helpers/reset-db';
import { buildCategory, buildProduct, buildProductVariant } from '@/tests/helpers/factories';
import {
  getProducts,
  getAdminProducts,
  getRelatedProducts,
} from '@/lib/db/queries/products.queries';

// docs/architecture.md §7: цена товара = MIN среди активных вариантов, integration (SQL-агрегат,
// не JS-цикл) — products.queries.ts; ILIKE-поиск по имени текущей локали с fallback EN; публичные
// query отдают только isActive:true, админские — все записи.

beforeEach(async () => {
  await resetDb();
});

describe('products.queries.getProducts — price aggregate', () => {
  it('resolves price to the MIN among active variants only, ignoring inactive ones', async () => {
    const product = await buildProduct();
    await buildProductVariant(product.id, { price: '15.00', isActive: true });
    await buildProductVariant(product.id, { price: '9.99', isActive: true });
    await buildProductVariant(product.id, { price: '1.00', isActive: false }); // cheapest but inactive — must not win

    const { products } = await getProducts({ locale: 'en' });

    expect(products).toHaveLength(1);
    expect(products[0]!.price).toBe('9.99');
  });

  it('excludes a product with no active variant from the public catalog entirely', async () => {
    const product = await buildProduct();
    await buildProductVariant(product.id, { isActive: false });

    const { products, total } = await getProducts({ locale: 'en' });

    expect(products).toHaveLength(0);
    expect(total).toBe(0);
  });
});

describe('products.queries.getProducts — search (ILIKE, current locale with EN fallback)', () => {
  it('matches nameEn case-insensitively for locale=en', async () => {
    const product = await buildProduct({ nameEn: 'Salmon Kibble' });
    await buildProductVariant(product.id);

    const { products } = await getProducts({ locale: 'en', search: 'salmon' });

    expect(products.map((p) => p.id)).toEqual([product.id]);
  });

  it('matches nameDe for locale=de when a German name is set', async () => {
    const product = await buildProduct({ nameEn: 'Salmon Kibble', nameDe: 'Lachs Trockenfutter' });
    await buildProductVariant(product.id);

    const { products } = await getProducts({ locale: 'de', search: 'lachs' });

    expect(products.map((p) => p.id)).toEqual([product.id]);
  });

  it('falls back to nameEn for locale=de when nameDe is not translated yet', async () => {
    const product = await buildProduct({ nameEn: 'Salmon Kibble', nameDe: null });
    await buildProductVariant(product.id);

    const { products } = await getProducts({ locale: 'de', search: 'salmon' });

    expect(products.map((p) => p.id)).toEqual([product.id]);
  });

  it('does not match unrelated products', async () => {
    const product = await buildProduct({ nameEn: 'Salmon Kibble' });
    await buildProductVariant(product.id);

    const { products } = await getProducts({ locale: 'en', search: 'chicken' });

    expect(products).toHaveLength(0);
  });
});

describe('products.queries — public vs admin isActive scope', () => {
  it('getProducts (public) returns only isActive:true products', async () => {
    const activeProduct = await buildProduct({ isActive: true });
    await buildProductVariant(activeProduct.id);
    const inactiveProduct = await buildProduct({ isActive: false });
    await buildProductVariant(inactiveProduct.id);

    const { products } = await getProducts({ locale: 'en' });

    expect(products.map((p) => p.id)).toEqual([activeProduct.id]);
  });

  it('getAdminProducts returns both active and inactive products', async () => {
    const activeProduct = await buildProduct({ isActive: true });
    await buildProductVariant(activeProduct.id);
    const inactiveProduct = await buildProduct({ isActive: false });
    await buildProductVariant(inactiveProduct.id);

    const { products, total } = await getAdminProducts();

    expect(total).toBe(2);
    expect(products.map((p) => p.id).sort()).toEqual([activeProduct.id, inactiveProduct.id].sort());
  });

  it('getAdminProducts does not drop a product that has no active variant (price: null instead)', async () => {
    const product = await buildProduct();
    await buildProductVariant(product.id, { isActive: false });

    const { products } = await getAdminProducts();

    expect(products).toHaveLength(1);
    expect(products[0]!.price).toBeNull();
  });
});

describe('products.queries.getRelatedProducts — "You may also like"', () => {
  it('returns other active products from the same ageGroup, excluding the product itself', async () => {
    const category = await buildCategory();
    const current = await buildProduct({ categoryId: category.id, ageGroup: 'kitten' });
    await buildProductVariant(current.id);
    const sameAgeGroup = await buildProduct({ categoryId: category.id, ageGroup: 'kitten' });
    await buildProductVariant(sameAgeGroup.id);
    const differentAgeGroup = await buildProduct({ categoryId: category.id, ageGroup: 'senior' });
    await buildProductVariant(differentAgeGroup.id);

    const related = await getRelatedProducts(current.id);

    expect(related.map((p) => p.id)).toEqual([sameAgeGroup.id]);
  });

  it('does not backfill from other ageGroups when fewer than 4 matches exist', async () => {
    const current = await buildProduct({ ageGroup: 'kitten' });
    await buildProductVariant(current.id);
    const differentAgeGroup = await buildProduct({ ageGroup: 'senior' });
    await buildProductVariant(differentAgeGroup.id);

    const related = await getRelatedProducts(current.id);

    expect(related).toHaveLength(0);
  });
});
