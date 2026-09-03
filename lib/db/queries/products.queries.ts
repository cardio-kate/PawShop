import 'server-only';
import { unstable_cache } from 'next/cache';
import { and, asc, desc, eq, ilike, inArray, ne, sql } from 'drizzle-orm';
import { dbHttp, dbPool } from '@/lib/db';
import { category, product, productVariant } from '@/lib/db/schema';
import { CATALOG_PAGE_SIZE } from '@/lib/constants';
import { routing } from '@/i18n/routing';
import type { AgeGroup } from '@/types';

// Только SQL/Drizzle-запросы, без бизнес-условий (CLAUDE.md → «Слои»): locale-fallback
// (nameDe ?? nameEn), запрет сохранения без фото/без активного варианта, генерация slug и т.п. —
// забота products.service.ts, не этого файла. Функции ниже возвращают колонки
// nameEn/nameDe/descriptionEn/descriptionDe как есть, не резолвят fallback (architecture.md §3.10).
//
// Кэширование — unstable_cache, не "use cache"/Cache Components: сверено с node_modules/next/dist/
// docs/01-app/02-guides/caching-without-cache-components.md — этот проект не включает
// cacheComponents (CLAUDE.md → «Кэш и SEO», несовместимость с next-intl), а в этом режиме
// unstable_cache остаётся официальным, не только "устаревшим для обратной совместимости" способом
// кэшировать non-fetch источники (Drizzle-запросы). Публичные getProducts/getProductBySlug/
// getRelatedProducts — тег 'products' (architecture.md §3.1), инвалидация только через
// revalidateTag из products.actions.ts, без TTL (revalidate не задаётся — иначе внесённая правка
// в админке ждала бы истечения TTL вместо мгновенного обновления, что architecture.md §3.1 прямо
// исключает). getCategories — исключение: длинный TTL без тега (architecture.md §3.7 — 4 строки,
// меняются только сид-скриптом в обход приложения, инвалидировать по событию нечему).

type Locale = (typeof routing.locales)[number];

const PRODUCT_COLUMNS = {
  id: product.id,
  slug: product.slug,
  categoryId: product.categoryId,
  nameEn: product.nameEn,
  nameDe: product.nameDe,
  descriptionEn: product.descriptionEn,
  descriptionDe: product.descriptionDe,
  composition: product.composition,
  analyticalConstituents: product.analyticalConstituents,
  flavor: product.flavor,
  ageGroup: product.ageGroup,
  images: product.images,
  isNew: product.isNew,
  isActive: product.isActive,
  createdAt: product.createdAt,
};

export interface ProductVariantRow {
  id: number;
  label: string;
  price: string;
  isActive: boolean;
}

type ProductRow = {
  id: number;
  slug: string;
  categoryId: number;
  nameEn: string;
  nameDe: string | null;
  descriptionEn: string;
  descriptionDe: string | null;
  composition: string | null;
  analyticalConstituents: string | null;
  flavor: string | null;
  ageGroup: AgeGroup;
  images: string[];
  isNew: boolean;
  isActive: boolean;
  createdAt: Date;
};

export type ProductListItem = ProductRow & { price: string; variants: ProductVariantRow[] };
export type ProductDetail = ProductRow & { variants: ProductVariantRow[] };
export type AdminProductListItem = ProductRow & { price: string | null };

// MIN(price) среди активных вариантов, агрегатом в SQL (CLAUDE.md → «База данных»), не JS-циклом
// по всем вариантам всех товаров. Отдельная функция — переиспользуется getProducts/
// getRelatedProducts/getAdminProducts, каждый вызов даёт свежий query builder (drizzle не
// переживает повторное использование одного и того же .as() между запросами).
function activeVariantPriceAgg() {
  return dbHttp
    .select({
      productId: productVariant.productId,
      minPrice: sql<string>`min(${productVariant.price})`.as('min_price'),
    })
    .from(productVariant)
    .where(eq(productVariant.isActive, true))
    .groupBy(productVariant.productId)
    .as('price_agg');
}

// ILIKE-паттерн строится из пользовательского ввода (`search`) без экранирования — `%`/`_`
// в самом искомом слове иначе трактуются как wildcard'ы ILIKE, а не литеральные символы (найдены
// PLAUSIBLE code-review — поиск по "50%" или содержащему "_" слову вернул бы не то, что ожидал
// пользователь). Экранируем именно эти два метасимвола и обратный слеш перед тем, как оборачивать
// в '%...%'.
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

// Один запрос на страницу результатов (не N+1 на товар) — variants нужны на карточке товара,
// чтобы выбрать самый дешёвый активный вариант для "Add to Cart" (ProductCard.tsx), и на странице
// товара — все варианты, включая неактивные, для chip "Out of stock" (ProductDetailClient.tsx).
async function getVariantsByProductIds(
  productIds: number[],
): Promise<Map<number, ProductVariantRow[]>> {
  if (productIds.length === 0) return new Map();

  const rows = await dbHttp
    .select({
      id: productVariant.id,
      productId: productVariant.productId,
      label: productVariant.label,
      price: productVariant.price,
      isActive: productVariant.isActive,
    })
    .from(productVariant)
    .where(inArray(productVariant.productId, productIds));

  const map = new Map<number, ProductVariantRow[]>();
  for (const { productId, ...variant } of rows) {
    const list = map.get(productId) ?? [];
    list.push(variant);
    map.set(productId, list);
  }
  return map;
}

export interface GetProductsFilters {
  locale: Locale;
  category?: number[];
  ageGroup?: AgeGroup[];
  priceFrom?: number;
  priceTo?: number;
  search?: string;
  // Home «New Arrivals» (product-spec.md §3.1: «отдельная выборка по флагу isNew») — расширение
  // существующего getProducts(filters), не новый action: тот же фильтр-объект, что category/
  // ageGroup выше, не отдельная функция.
  isNew?: boolean;
  limit?: number;
  offset?: number;
}

// Общая часть WHERE между getProducts и её fallback-COUNT ниже — принимает свой priceAgg, а не
// делит один объект с вызывающей стороной: drizzle не переживает повторное использование одного
// и того же .as() между двумя разными запросами (см. комментарий у activeVariantPriceAgg).
function buildProductConditions(
  filters: GetProductsFilters,
  priceAgg: ReturnType<typeof activeVariantPriceAgg>,
) {
  const conditions = [eq(product.isActive, true)];
  if (filters.category && filters.category.length > 0) {
    conditions.push(inArray(product.categoryId, filters.category));
  }
  if (filters.ageGroup && filters.ageGroup.length > 0) {
    conditions.push(inArray(product.ageGroup, filters.ageGroup));
  }
  if (filters.isNew !== undefined) {
    conditions.push(eq(product.isNew, filters.isNew));
  }

  const search = filters.search?.trim();
  if (search) {
    const pattern = `%${escapeLikePattern(search)}%`;
    // ТЗ §11 / architecture.md §3.10: только имя ТЕКУЩЕЙ локали, с fallback на EN для
    // непереведённых на DE — не по обеим колонкам сразу, не по description/flavor/категории.
    conditions.push(
      filters.locale === 'de'
        ? sql`coalesce(${product.nameDe}, ${product.nameEn}) ILIKE ${pattern}`
        : ilike(product.nameEn, pattern),
    );
  }

  if (filters.priceFrom !== undefined) {
    conditions.push(sql`${priceAgg.minPrice} >= ${filters.priceFrom}`);
  }
  if (filters.priceTo !== undefined) {
    conditions.push(sql`${priceAgg.minPrice} <= ${filters.priceTo}`);
  }

  return conditions;
}

// count(*) over() в getProducts ниже приходит только вместе со строками результата — если offset
// ушёл за пределы найденного (устаревший ?page= в URL после смены фильтров, прямой переход на
// несуществующую страницу), rows пуст и total вместе с ним. Отдельный COUNT(*) — только в этом
// редком случае (offset > 0 и страница оказалась пустой), не на каждый вызов getProducts.
async function countProducts(filters: GetProductsFilters): Promise<number> {
  const priceAgg = activeVariantPriceAgg();
  const conditions = buildProductConditions(filters, priceAgg);
  const [row] = await dbHttp
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(product)
    .innerJoin(priceAgg, eq(priceAgg.productId, product.id))
    .where(and(...conditions));
  return row?.count ?? 0;
}

// Публичный каталог — только isActive: true (architecture.md §4). category/ageGroup — массивы
// (мультивыбор, CatalogClient.tsx), не одиночное значение. limit/offset с дефолтом
// CATALOG_PAGE_SIZE=8, всегда возвращает total для пагинации (architecture.md §4 «Пагинация
// каталога — решено»).
async function getProductsUncached(
  filters: GetProductsFilters,
): Promise<{ products: ProductListItem[]; total: number }> {
  const limit = filters.limit ?? CATALOG_PAGE_SIZE;
  const offset = filters.offset ?? 0;
  const priceAgg = activeVariantPriceAgg();
  const conditions = buildProductConditions(filters, priceAgg);

  const rows = await dbHttp
    .select({
      ...PRODUCT_COLUMNS,
      price: priceAgg.minPrice,
      total: sql<number>`count(*) over()`.mapWith(Number),
    })
    .from(product)
    .innerJoin(priceAgg, eq(priceAgg.productId, product.id))
    .where(and(...conditions))
    // categoryId ASC, не только createdAt DESC — категории заведены сид-скриптом в порядке
    // Dry food(1)/Wet food(2)/Treats(3)/Accessories(4), тот же порядок, что и в ТЗ §3. Без этого
    // без фильтра каталог сортировался только по свежести, и аксессуары (заведённые последними по
    // времени) всплывали в самое начало витрины перед едой — по прямому запросу закреплены
    // последними, свежесть остаётся вторичным критерием внутри каждой категории.
    .orderBy(asc(product.categoryId), desc(product.createdAt))
    .limit(limit)
    .offset(offset);

  const variantsByProductId = await getVariantsByProductIds(rows.map((row) => row.id));
  const total = rows[0]?.total ?? (offset > 0 ? await countProducts(filters) : 0);

  return {
    products: rows.map((row) => {
      // total дропается намеренно из элементов списка, уже прочитан отдельно выше.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { total, ...productRow } = row;
      return { ...productRow, variants: variantsByProductId.get(row.id) ?? [] };
    }),
    total,
  };
}

// unstable_cache уже сериализует filters (обычный аргумент) в часть ключа — отдельные keyParts не
// нужны, ключ и так учитывает locale/category/search/offset и т.д. (см. комментарий вверху файла
// про caching-without-cache-components.md).
export const getProducts = unstable_cache(getProductsUncached, ['products-list'], {
  tags: ['products'],
});

// Публичная страница товара — только isActive: true, иначе 404 решает products.service.ts (эта
// функция просто возвращает null на отсутствие/неактивность).
async function getProductBySlugUncached(slug: string): Promise<ProductDetail | null> {
  const [row] = await dbHttp
    .select(PRODUCT_COLUMNS)
    .from(product)
    .where(and(eq(product.slug, slug), eq(product.isActive, true)))
    .limit(1);
  if (!row) return null;

  const variants = (await getVariantsByProductIds([row.id])).get(row.id) ?? [];
  return { ...row, variants };
}

export const getProductBySlug = unstable_cache(getProductBySlugUncached, ['product-by-slug'], {
  tags: ['products'],
});

// «You may also like» (ТЗ §7.3) — та же ageGroup, не категория; если подходящих меньше 4,
// возвращается сколько есть, без добора из других ageGroup (architecture.md §3.1). Кэшируется тем
// же тегом products, что и страница товара (architecture.md §3.1) — инвалидируется вместе с ней.
async function getRelatedProductsUncached(productId: number): Promise<ProductListItem[]> {
  const [current] = await dbHttp
    .select({ ageGroup: product.ageGroup })
    .from(product)
    .where(eq(product.id, productId))
    .limit(1);
  if (!current) return [];

  const priceAgg = activeVariantPriceAgg();
  const rows = await dbHttp
    .select({ ...PRODUCT_COLUMNS, price: priceAgg.minPrice })
    .from(product)
    .innerJoin(priceAgg, eq(priceAgg.productId, product.id))
    .where(
      and(
        eq(product.isActive, true),
        eq(product.ageGroup, current.ageGroup),
        ne(product.id, productId),
      ),
    )
    .orderBy(desc(product.createdAt))
    .limit(4);

  const variantsByProductId = await getVariantsByProductIds(rows.map((row) => row.id));
  return rows.map((row) => ({ ...row, variants: variantsByProductId.get(row.id) ?? [] }));
}

export const getRelatedProducts = unstable_cache(
  getRelatedProductsUncached,
  ['related-products'],
  { tags: ['products'] },
);

// Без отдельного action-файла (architecture.md §3.7) — фиксированный справочник, 4 строки,
// заводятся scripts/seed-categories.ts, не CRUD. Длинный TTL, без тега — architecture.md §3.7:
// меняется только сид-скриптом в обход приложения, событию revalidateTag неоткуда взяться.
const getCategoriesUncached = async () => {
  return dbHttp.select().from(category).orderBy(asc(category.id));
};

export const getCategories = unstable_cache(getCategoriesUncached, ['categories'], {
  revalidate: 60 * 60 * 24,
});

// Админ — все записи независимо от isActive (карточку/товар нужно видеть, чтобы вернуть в
// продажу), с полным списком вариантов (включая неактивные) для ProductForm/VariantEditor.
export async function getProduct(id: number): Promise<ProductDetail | null> {
  const [row] = await dbHttp
    .select(PRODUCT_COLUMNS)
    .from(product)
    .where(eq(product.id, id))
    .limit(1);
  if (!row) return null;

  const variants = (await getVariantsByProductIds([row.id])).get(row.id) ?? [];
  return { ...row, variants };
}

export interface GetAdminProductsFilters {
  limit?: number;
  offset?: number;
}

// Без category/ageGroup/price/search-фильтров — ProductTable.tsx (Фаза 5) сейчас не предполагает
// панель фильтров вообще, только полный список; изобретать несуществующий UI-контракт заранее —
// то же решение, что REV2 принял для getOrders(filters) (только status/limit/offset по аналогии).
// leftJoin, не innerJoin — в отличие от публичного getProducts, товар без активных вариантов не
// должен пропасть из списка администратора (price будет null, а не товар молча исчезнет из
// таблицы).
export async function getAdminProducts(
  filters: GetAdminProductsFilters = {},
): Promise<{ products: AdminProductListItem[]; total: number }> {
  const limit = filters.limit ?? CATALOG_PAGE_SIZE;
  const offset = filters.offset ?? 0;
  const priceAgg = activeVariantPriceAgg();

  const rows = await dbHttp
    .select({
      ...PRODUCT_COLUMNS,
      price: priceAgg.minPrice,
      total: sql<number>`count(*) over()`.mapWith(Number),
    })
    .from(product)
    .leftJoin(priceAgg, eq(priceAgg.productId, product.id))
    .orderBy(desc(product.createdAt))
    .limit(limit)
    .offset(offset);

  // Как и в getProducts выше — count(*) over() приходит только вместе со строками; на странице
  // за пределами total (устаревший offset) rows пуст, и total нужно достать отдельным COUNT(*).
  let total = rows[0]?.total;
  if (total === undefined && offset > 0) {
    const [countRow] = await dbHttp
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(product);
    total = countRow?.count ?? 0;
  }

  return {
    products: rows.map((row) => {
      // total дропается намеренно из элементов списка, уже прочитан отдельно выше.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { total, ...productRow } = row;
      return productRow;
    }),
    total: total ?? 0,
  };
}

// products.service.ts генерирует slug из nameEn и подбирает свободный вариант этой функцией —
// TOCTOU-гонка (два параллельных createProduct с одинаковым именем) здесь сознательно не
// закрывается блокировкой: единственный источник вызова — один админ (тот же принцип, что и
// для запрета деактивации последнего варианта в products.service.ts).
export async function slugExists(slug: string): Promise<boolean> {
  const [row] = await dbHttp
    .select({ id: product.id })
    .from(product)
    .where(eq(product.slug, slug))
    .limit(1);
  return !!row;
}

export interface ProductWriteData {
  categoryId: number;
  nameEn: string;
  nameDe: string | null;
  descriptionEn: string;
  descriptionDe: string | null;
  composition: string | null;
  analyticalConstituents: string | null;
  flavor: string | null;
  ageGroup: AgeGroup;
  images: string[];
  isNew: boolean;
  isActive: boolean;
}

export interface VariantWriteData {
  id?: number;
  label: string;
  price: string;
  isActive: boolean;
}

// Product + ProductVariant[] в одной транзакции (dbPool, не dbHttp — architecture.md §4, тот же
// принцип, что у Order+OrderItem[]): без атомарности сбой между двумя insert'ами оставил бы в базе
// товар без единого варианта, ровно то состояние, которое products.service.ts обязан не допускать.
export async function createProductWithVariants(
  data: ProductWriteData & { slug: string },
  variants: VariantWriteData[],
): Promise<number> {
  return dbPool.transaction(async (tx) => {
    const [row] = await tx.insert(product).values(data).returning({ id: product.id });
    if (!row) {
      throw new Error('products.queries.createProductWithVariants: insert returned no row');
    }
    await tx.insert(productVariant).values(
      variants.map((variant) => ({
        productId: row.id,
        label: variant.label,
        price: variant.price,
        isActive: variant.isActive,
      })),
    );
    return row.id;
  });
}

// variants — полный желаемый набор вариантов товара (не diff/patch): элементы с id из уже
// существующих обновляются, без id — вставляются как новые. Существующие варианты, которых нет
// среди присланных (админ удалил строку в VariantEditor до сохранения) — деактивируются
// (isActive: false), не удаляются физически (CLAUDE.md → «База данных», soft delete через isActive
// везде, где это указано для ProductVariant) — иначе OrderItem.variantId у прошлых заказов,
// ссылающийся на эту строку, потерял бы связь раньше времени.
export async function updateProductWithVariants(
  id: number,
  data: ProductWriteData,
  variants: VariantWriteData[],
): Promise<void> {
  await dbPool.transaction(async (tx) => {
    await tx.update(product).set(data).where(eq(product.id, id));

    const existingVariants = await tx
      .select({ id: productVariant.id })
      .from(productVariant)
      .where(eq(productVariant.productId, id));
    const existingIds = new Set(existingVariants.map((row) => row.id));
    const submittedIds = new Set(
      variants.filter((variant) => variant.id !== undefined).map((variant) => variant.id!),
    );

    // Обновления/вставки не зависят друг от друга (разные строки) — один INSERT на все новые
    // варианты вместо N последовательных, обновления существующих запускаются параллельно на том
    // же соединении транзакции вместо ожидания каждого по очереди.
    const toUpdate = variants.filter(
      (variant): variant is VariantWriteData & { id: number } =>
        variant.id !== undefined && existingIds.has(variant.id),
    );
    const toInsert = variants.filter(
      (variant) => variant.id === undefined || !existingIds.has(variant.id),
    );

    await Promise.all([
      ...toUpdate.map((variant) =>
        tx
          .update(productVariant)
          .set({ label: variant.label, price: variant.price, isActive: variant.isActive })
          .where(eq(productVariant.id, variant.id)),
      ),
      toInsert.length > 0
        ? tx.insert(productVariant).values(
            toInsert.map((variant) => ({
              productId: id,
              label: variant.label,
              price: variant.price,
              isActive: variant.isActive,
            })),
          )
        : Promise.resolve(),
    ]);

    const removedIds = [...existingIds].filter((existingId) => !submittedIds.has(existingId));
    if (removedIds.length > 0) {
      await tx
        .update(productVariant)
        .set({ isActive: false })
        .where(inArray(productVariant.id, removedIds));
    }
  });
}

// deleteProduct (ТЗ §10) = soft delete, не DELETE (CLAUDE.md → «База данных») — единственный
// вызывающий, products.service.ts, не даёт этому дойти до физического удаления строки.
export async function setProductActive(id: number, isActive: boolean): Promise<void> {
  await dbHttp.update(product).set({ isActive }).where(eq(product.id, id));
}

export interface OrderableVariantRow {
  variantId: number;
  productId: number;
  // Telegram-уведомления и админка — фиксированно английские, не зависят от локали покупателя
  // (CLAUDE.md → «Мультиязычность», «Что не локализуется»), поэтому здесь nameEn как есть, без
  // резолва fallback через products.service.ts, в отличие от публичных getProducts/getProductBySlug.
  productName: string;
  variantLabel: string;
  price: string;
  productIsActive: boolean;
  variantIsActive: boolean;
}

// orders.service.ts перепроверяет каждую позицию корзины по этой функции при createOrder (CLAUDE.md
// → «Заказ и корзина»: клиентским ценам/доступности не доверять никогда) — isActive обеих таблиц
// возвращается как есть, не фильтруется здесь, решение "включать ли в заказ" принимает сервис.
export async function getVariantsForOrder(variantIds: number[]): Promise<OrderableVariantRow[]> {
  if (variantIds.length === 0) return [];

  return dbHttp
    .select({
      variantId: productVariant.id,
      productId: productVariant.productId,
      productName: product.nameEn,
      variantLabel: productVariant.label,
      price: productVariant.price,
      productIsActive: product.isActive,
      variantIsActive: productVariant.isActive,
    })
    .from(productVariant)
    .innerJoin(product, eq(product.id, productVariant.productId))
    .where(inArray(productVariant.id, variantIds));
}
