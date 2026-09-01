'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { requireAdminSession } from '@/lib/auth';
import {
  getAdminDeliveryCountries as queryGetAdminDeliveryCountries,
  getDeliveryCountries as queryGetDeliveryCountries,
  updateDeliveryCountry as queryUpdateDeliveryCountry,
  type DeliveryCountryRow,
} from '@/lib/db/queries/delivery.queries';
import { deliveryCountryUpdateSchema } from '@/lib/validation/delivery.schema';

// Полный список — ТЗ §5 / .claude/plans/backend-realization-pawshop.md, Фаза 3.

type ActionResult<T> =
  { success: true; data: T } | { success: false; errors: Record<string, string> };

// Дублирует products.actions.ts/auth.actions.ts — тот же паттерн, третье появление уже есть в
// products.actions.ts, но вынос в общий helper не часть этой фазы (не трогать чужой файл ради
// рефакторинга, который явно не запрошен).
function zodIssuesToFieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : 'root';
    errors[key] ??= issue.message;
  }
  return errors;
}

const countryIdSchema = z.number().int().positive({ error: 'Invalid country id.' });

// --- Публичная (без requireAdminSession — витрина, ТЗ §5): /delivery, CountrySelect в CheckoutClient. ---

export async function getDeliveryCountries(): Promise<DeliveryCountryRow[]> {
  return queryGetDeliveryCountries();
}

// --- Административная (requireAdminSession() первым шагом — architecture.md §3.4 п.2). ---

export async function getAdminDeliveryCountries(): Promise<DeliveryCountryRow[]> {
  await requireAdminSession();
  return queryGetAdminDeliveryCountries();
}

// product-spec.md §11: только правка price/estimatedDays/isActive у уже существующей страны —
// create/delete через action нет (см. lib/validation/delivery.schema.ts).
export async function updateDeliveryCountry(
  id: number,
  input: unknown,
): Promise<ActionResult<null>> {
  await requireAdminSession();

  const parsedId = countryIdSchema.safeParse(id);
  const parsedInput = deliveryCountryUpdateSchema.safeParse(input);
  if (!parsedId.success || !parsedInput.success) {
    return {
      success: false,
      errors: {
        ...(parsedId.success ? {} : { root: parsedId.error.issues[0]!.message }),
        ...(parsedInput.success ? {} : zodIssuesToFieldErrors(parsedInput.error)),
      },
    };
  }

  await queryUpdateDeliveryCountry(parsedId.data, parsedInput.data);
  revalidateTag('delivery', 'max');
  return { success: true, data: null };
}
