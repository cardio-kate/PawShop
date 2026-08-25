'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { requireAdminSession } from '@/lib/auth';
import * as productsService from '@/lib/services/products.service';
import {
  getAdminProducts as queryGetAdminProducts,
  getProduct as queryGetProduct,
  type AdminProductListItem,
  type GetAdminProductsFilters,
  type ProductDetail,
} from '@/lib/db/queries/products.queries';
import { imageUploadTokenSchema, productSchema } from '@/lib/validation/product.schema';
import { vercelBlobProvider as storage } from '@/lib/storage/vercel-blob.provider';
import { routing } from '@/i18n/routing';
import type {
  ResolvedProductDetail,
  ResolvedProductListItem,
  SaveProductError,
} from '@/lib/services/products.service';
import type { UploadToken } from '@/lib/storage/storage.interface';

// Полный список — ТЗ §5 / .claude/plans/backend-realization-pawshop.md, Фаза 2. getCategories() —
// намеренно не сюда, вызывается напрямую из products.queries.ts (architecture.md §3.7).
//
// [AGENTS.md] revalidateTag в этой версии Next (16.3) требует ВТОРОЙ аргумент — профиль
// ('max'/'days'/... или { expire }), в отличие от однопараметрового API из обучающих данных;
// сверено с node_modules/next/dist/server/web/spec-extension/revalidate.d.ts. 'max' — тот же
// профиль, что в официальном примере doc (stale-while-revalidate с самым долгим stale-окном).

type ActionResult<T> =
  { success: true; data: T } | { success: false; errors: Record<string, string> };

// Дублирует auth.actions.ts — тот же паттерн, третье появление (после auth) стало бы поводом
// вынести в общий helper, сейчас две копии не оправдывают преждевременную абстракцию.
function zodIssuesToFieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : 'root';
    errors[key] ??= issue.message;
  }
  return errors;
}

const SAVE_PRODUCT_ERROR_MESSAGES: Record<SaveProductError, string> = {
  missing_photo: 'At least one photo is required.',
  missing_variant: 'At least one variant is required.',
  no_active_variant: 'At least one variant must remain active.',
};

const productIdSchema = z.number().int().positive({ error: 'Invalid product id.' });

// CatalogClient.tsx (Фаза 5) вызывает это напрямую как Server Action при смене фильтров — вход
// валидируется, даже хотя обычно приходит из уже типизированного React-состояния: Server Action
// вызывается в обход UI так же легко, как форма в обход zodResolver (architecture.md §3.11).
const getProductsFiltersSchema = z.object({
  locale: z.enum(routing.locales),
  category: z.array(z.number().int().positive()).optional(),
  ageGroup: z.array(z.enum(['kitten', 'adult', 'senior'])).optional(),
  priceFrom: z.number().nonnegative().optional(),
  priceTo: z.number().nonnegative().optional(),
  search: z.string().optional(),
  isNew: z.boolean().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

// --- Публичные (без requireAdminSession — витрина, ТЗ §5). ---

export async function getProducts(
  input: unknown,
): Promise<ActionResult<{ products: ResolvedProductListItem[]; total: number }>> {
  const parsed = getProductsFiltersSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: zodIssuesToFieldErrors(parsed.error) };
  }

  const data = await productsService.getProducts(parsed.data);
  return { success: true, data };
}

export async function getProductBySlug(
  slug: string,
  locale: (typeof routing.locales)[number],
): Promise<ResolvedProductDetail | null> {
  return productsService.getProductBySlug(slug, locale);
}

export async function getRelatedProducts(
  productId: number,
  locale: (typeof routing.locales)[number],
): Promise<ResolvedProductListItem[]> {
  return productsService.getRelatedProducts(productId, locale);
}

// --- Административные (requireAdminSession() первым шагом — architecture.md §3.4 п.2: proxy.ts
// не единственная линия защиты, каждый admin action проверяет сессию сам). ---

// Простые data-fetching actions для дашборда (не форма) — при неверной сессии
// requireAdminSession() бросает, тот же "нет мягкого провала", что у adminLogout (auth.actions.ts).
export async function getProduct(id: number): Promise<ProductDetail | null> {
  await requireAdminSession();
  return queryGetProduct(id);
}

export async function getAdminProducts(
  filters: GetAdminProductsFilters = {},
): Promise<{ products: AdminProductListItem[]; total: number }> {
  await requireAdminSession();
  return queryGetAdminProducts(filters);
}

// architecture.md §3.5: файл не идёт через тело этого action — только contentType, чтобы выдать
// короткоживущий токен. ImageUploader вызывает это перед прямой загрузкой в Vercel Blob, для
// каждого выбранного файла отдельно; сам файл на сервер не попадает ни здесь, ни где-либо ещё.
export async function getProductImageUploadToken(
  input: unknown,
): Promise<ActionResult<UploadToken>> {
  await requireAdminSession();

  const parsed = imageUploadTokenSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: zodIssuesToFieldErrors(parsed.error) };
  }

  const data = await storage.createUploadToken(parsed.data);
  return { success: true, data };
}

export async function createProduct(input: unknown): Promise<ActionResult<{ id: number }>> {
  await requireAdminSession();

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: zodIssuesToFieldErrors(parsed.error) };
  }

  const result = await productsService.createProduct(parsed.data);
  if (!result.success) {
    return { success: false, errors: { root: SAVE_PRODUCT_ERROR_MESSAGES[result.error] } };
  }

  revalidateTag('products', 'max');
  return { success: true, data: result.data };
}

export async function updateProduct(id: number, input: unknown): Promise<ActionResult<null>> {
  await requireAdminSession();

  const parsedId = productIdSchema.safeParse(id);
  const parsedInput = productSchema.safeParse(input);
  if (!parsedId.success || !parsedInput.success) {
    return {
      success: false,
      errors: {
        ...(parsedId.success ? {} : { root: parsedId.error.issues[0]!.message }),
        ...(parsedInput.success ? {} : zodIssuesToFieldErrors(parsedInput.error)),
      },
    };
  }

  const result = await productsService.updateProduct(parsedId.data, parsedInput.data);
  if (!result.success) {
    return { success: false, errors: { root: SAVE_PRODUCT_ERROR_MESSAGES[result.error] } };
  }

  revalidateTag('products', 'max');
  return { success: true, data: null };
}

export async function deleteProduct(id: number): Promise<ActionResult<null>> {
  await requireAdminSession();

  const parsedId = productIdSchema.safeParse(id);
  if (!parsedId.success) {
    return { success: false, errors: { root: parsedId.error.issues[0]!.message } };
  }

  await productsService.deleteProduct(parsedId.data);
  revalidateTag('products', 'max');
  return { success: true, data: null };
}
