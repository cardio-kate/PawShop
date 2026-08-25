import { z } from 'zod';
import { PRODUCT_IMAGE_ALLOWED_CONTENT_TYPES } from '@/lib/constants';

// ProductForm живёт в /nine-lives/dashboard — admin-форма, ошибки на английском без ключей
// перевода, как и auth.schema.ts (CLAUDE.md → «Мультиязычность», «Что не локализуется»).
// Zod v4: кастомизация сообщений — параметр `error`, не `message`/`invalid_type_error` из v3.
//
// images/variants — .min(1) здесь даёт мгновенную обратную связь в zodResolver на клиенте, но не
// заменяет проверку в products.service.ts (CLAUDE.md → «База данных»: "не только в форме на
// клиенте") — сервис перепроверяет то же самое независимо от того, прошёл ли вызов через эту схему.
// Правило "должен остаться хотя бы один АКТИВНЫЙ вариант" сюда сознательно не продублировано
// .refine()'ом — это кросс-полевой бизнес-инвариант, а не формат поля, и таблица тестов
// (architecture.md §7) закрепляет его юнит-тестом именно products.service.ts, не схемы.

const priceSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, { error: 'Price must be a valid amount (e.g. 12.90)' });

const variantInputSchema = z.object({
  // Есть у уже существующего варианта (редактирование), нет у нового, добавленного в форме
  // (VariantEditor.addVariant даёт клиентский crypto.randomUUID(), не число) — products.service.ts
  // решает insert/update по наличию этого поля, не по формату id.
  id: z.number().int().positive().optional(),
  label: z.string().min(1, { error: 'Variant label is required' }),
  price: priceSchema,
  isActive: z.boolean(),
});

export const productSchema = z.object({
  categoryId: z.number().int().positive({ error: 'Category is required' }),
  nameEn: z.string().min(1, { error: 'Name is required' }),
  // DE-поля — nullable/optional, не заполняются из ProductForm (admin — английский, перевод
  // делается отдельно), fallback на EN резолвит products.service.ts, не эта схема.
  nameDe: z.string().nullable().optional(),
  descriptionEn: z.string().min(1, { error: 'Description is required' }),
  descriptionDe: z.string().nullable().optional(),
  composition: z.string().nullable().optional(),
  analyticalConstituents: z.string().nullable().optional(),
  flavor: z.string().nullable().optional(),
  ageGroup: z.enum(['kitten', 'adult', 'senior']),
  images: z.array(z.string().min(1)).min(1, { error: 'At least one photo is required' }),
  isNew: z.boolean(),
  isActive: z.boolean(),
  variants: z.array(variantInputSchema).min(1, { error: 'At least one variant is required' }),
});

export type ProductInput = z.infer<typeof productSchema>;

// ImageUploader запрашивает upload-токен по одному файлу за раз, до реальной загрузки — contentType
// известен из выбранного File ещё на клиенте, тело файла в этот вызов не попадает (architecture.md
// §3.5).
export const imageUploadTokenSchema = z.object({
  contentType: z.enum(PRODUCT_IMAGE_ALLOWED_CONTENT_TYPES, {
    error: 'Unsupported image type. Use JPEG, PNG or WebP.',
  }),
});

export type ImageUploadTokenInput = z.infer<typeof imageUploadTokenSchema>;
