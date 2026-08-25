import 'server-only';
import {
  createProductWithVariants,
  getProduct as queryGetProduct,
  getProductBySlug as queryGetProductBySlug,
  getProducts as queryGetProducts,
  getRelatedProducts as queryGetRelatedProducts,
  setProductActive,
  slugExists,
  updateProductWithVariants,
  type GetProductsFilters,
  type ProductDetail,
  type ProductListItem,
  type ProductVariantRow,
} from '@/lib/db/queries/products.queries';
import { PRODUCT_MIN_ITEMS } from '@/lib/constants';
import { vercelBlobProvider as storage } from '@/lib/storage/vercel-blob.provider';
import { routing } from '@/i18n/routing';
import type { ProductInput } from '@/lib/validation/product.schema';

type Locale = (typeof routing.locales)[number];

// --- Locale fallback (architecture.md §3.10): queries отдают nameEn/nameDe/descriptionEn/
// descriptionDe как есть, резолвит эта функция — компоненты не должны знать про fallback. ---

function resolveText(en: string, de: string | null, locale: Locale): string {
  return locale === 'de' ? (de ?? en) : en;
}

type LocalizedFields = { name: string; description: string };
type LocalizedRow = {
  nameEn: string;
  nameDe: string | null;
  descriptionEn: string;
  descriptionDe: string | null;
};

// Один генерик вместо двух почти идентичных функций (resolveListItem/resolveDetail различались
// только типом строки, не логикой) — ProductListItem и ProductDetail оба структурно совпадают с
// LocalizedRow, так что резолвится тем же кодом.
function resolveLocalizedFields<T extends LocalizedRow>(
  row: T,
  locale: Locale,
): Omit<T, 'nameEn' | 'nameDe' | 'descriptionEn' | 'descriptionDe'> & LocalizedFields {
  const { nameEn, nameDe, descriptionEn, descriptionDe, ...rest } = row;
  return {
    ...rest,
    name: resolveText(nameEn, nameDe, locale),
    description: resolveText(descriptionEn, descriptionDe, locale),
  };
}

export type ResolvedProductListItem = ReturnType<typeof resolveLocalizedFields<ProductListItem>>;
export type ResolvedProductDetail = ReturnType<typeof resolveLocalizedFields<ProductDetail>>;

export async function getProducts(
  filters: GetProductsFilters,
): Promise<{ products: ResolvedProductListItem[]; total: number }> {
  const { products, total } = await queryGetProducts(filters);
  return {
    products: products.map((row) => resolveLocalizedFields(row, filters.locale)),
    total,
  };
}

export async function getProductBySlug(
  slug: string,
  locale: Locale,
): Promise<ResolvedProductDetail | null> {
  const row = await queryGetProductBySlug(slug);
  return row ? resolveLocalizedFields(row, locale) : null;
}

export async function getRelatedProducts(
  productId: number,
  locale: Locale,
): Promise<ResolvedProductListItem[]> {
  const rows = await queryGetRelatedProducts(productId);
  return rows.map((row) => resolveLocalizedFields(row, locale));
}

// --- Slug (не форма — генерируется из nameEn при создании, стабилен при последующих правках). ---

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // диакритика (Müller -> muller)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || 'product';
  let candidate = base;
  let suffix = 2;
  // Последовательная проверка кандидатов, не параллелизуемо — каждый следующий зависит от
  // результата предыдущей проверки.
  while (await slugExists(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

// --- Сохранение (ТЗ §10, CLAUDE.md → «База данных»). ---

// «у товара не осталось ни одного активного варианта» — architecture.md §3.11, пример root-ошибки
// без привязки к полю. Схема (product.schema.ts) уже гарантирует images.length>=1 и
// variants.length>=1 при вызове через zodResolver/safeParse — эта функция перепроверяет то же самое
// независимо от схемы (CLAUDE.md: "не только в форме на клиенте"), плюс единственное место, где
// проверяется "хотя бы один АКТИВНЫЙ вариант" (кросс-полевой инвариант, не формат поля).
export type SaveProductError = 'missing_photo' | 'missing_variant' | 'no_active_variant';

function validateSaveable(
  images: string[],
  variants: { isActive: boolean }[],
): SaveProductError | null {
  if (images.length < PRODUCT_MIN_ITEMS) return 'missing_photo';
  if (variants.length < PRODUCT_MIN_ITEMS) return 'missing_variant';
  if (!variants.some((variant) => variant.isActive)) return 'no_active_variant';
  return null;
}

function toWriteData(input: ProductInput) {
  return {
    categoryId: input.categoryId,
    nameEn: input.nameEn,
    nameDe: input.nameDe ?? null,
    descriptionEn: input.descriptionEn,
    descriptionDe: input.descriptionDe ?? null,
    composition: input.composition ?? null,
    analyticalConstituents: input.analyticalConstituents ?? null,
    flavor: input.flavor ?? null,
    ageGroup: input.ageGroup,
    images: input.images,
    isNew: input.isNew,
    isActive: input.isActive,
  };
}

export type CreateProductResult =
  { success: true; data: { id: number } } | { success: false; error: SaveProductError };

export async function createProduct(input: ProductInput): Promise<CreateProductResult> {
  const validationError = validateSaveable(input.images, input.variants);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const slug = await generateUniqueSlug(input.nameEn);
  const id = await createProductWithVariants(
    { ...toWriteData(input), slug },
    input.variants.map((variant) => ({
      label: variant.label,
      price: variant.price,
      isActive: variant.isActive,
    })),
  );

  return { success: true, data: { id } };
}

export type UpdateProductResult = { success: true } | { success: false; error: SaveProductError };

// architecture.md §3.5: замена/удаление фото товара не должна оставлять файлы висеть в Blob
// навсегда — удаляем только те URL, которых больше нет в новом images[] (не всё старое минус
// новое по значению, а именно множественная разница, порядок/дубликаты не важны). Сбой удаления в
// хранилище — orphan-файл, не повод откатывать уже сохранённые данные товара, поэтому try/catch
// вокруг каждого вызова, а не вокруг всей функции.
async function deleteRemovedImages(oldImages: string[], newImages: string[]): Promise<void> {
  const stillUsed = new Set(newImages);
  const removed = oldImages.filter((url) => !stillUsed.has(url));
  await Promise.all(
    removed.map((url) =>
      storage.delete(url).catch((error: unknown) => {
        console.error('products.service: failed to delete blob', url, error);
      }),
    ),
  );
}

// slug не пересчитывается при правке имени — стабильный URL товара важнее "красивого" совпадения
// slug/названия после переименования (architecture.md §3.10: slug один на обе локали, не
// переводится — тот же принцип стабильности).
export async function updateProduct(id: number, input: ProductInput): Promise<UpdateProductResult> {
  const validationError = validateSaveable(input.images, input.variants);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const previous = await queryGetProduct(id);

  await updateProductWithVariants(
    id,
    toWriteData(input),
    input.variants.map((variant) => ({
      id: variant.id,
      label: variant.label,
      price: variant.price,
      isActive: variant.isActive,
    })),
  );

  if (previous) {
    await deleteRemovedImages(previous.images, input.images);
  }

  return { success: true };
}

// ТЗ §10 «Удаление» = isActive: false, не DELETE (CLAUDE.md → «База данных»).
export async function deleteProduct(id: number): Promise<{ success: true }> {
  await setProductActive(id, false);
  return { success: true };
}

export type { ProductVariantRow };
