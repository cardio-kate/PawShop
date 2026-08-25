'use server';

import { z } from 'zod';
import { requireAdminSession } from '@/lib/auth';
import * as ordersService from '@/lib/services/orders.service';
import {
  getOrders as queryGetOrders,
  getOrder as queryGetOrder,
  getNewOrdersCount as queryGetNewOrdersCount,
  updateOrderStatus as queryUpdateOrderStatus,
  type GetOrdersFilters,
  type OrderDetail,
  type OrderListItem,
} from '@/lib/db/queries/orders.queries';
import { orderSchema } from '@/lib/validation/order.schema';
import type { CreateOrderError } from '@/lib/services/orders.service';

// Полный список — ТЗ §5 / .claude/plans/backend-realization-pawshop.md, Фаза 4. Без revalidateTag —
// в отличие от products.actions.ts/delivery.actions.ts, для заказов в архитектуре нет тега кэша
// (orders.queries.ts не оборачивается в unstable_cache, см. комментарий там же).

type ActionResult<T> =
  { success: true; data: T } | { success: false; errors: Record<string, string> };

// Дублирует products.actions.ts/delivery.actions.ts/auth.actions.ts — тот же паттерн в четвёртом
// файле подряд, вынос в общий helper по-прежнему не часть ни одной из этих фаз по отдельности.
function zodIssuesToFieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : 'root';
    errors[key] ??= issue.message;
  }
  return errors;
}

// Ошибки orders.service.createOrder, не покрытые самой Zod-схемой (rate-limit, страна пропала/
// деактивирована, индекс не прошёл Ирландский Eircode, ни одной доступной позиции после фильтрации)
// — тоже ключи перевода 'Checkout.errors.*' (CLAUDE.md → «Мультиязычность»), не готовый текст.
// invalid_postal_code/invalid_country привязаны к конкретному полю (setError(field, ...) в форме),
// остальные — root, тот же принцип, что root-ошибка "нет активного варианта" в products.actions.ts.
const CREATE_ORDER_ERROR_FIELDS: Record<CreateOrderError, string> = {
  rate_limited: 'root',
  invalid_country: 'deliveryCountryId',
  invalid_postal_code: 'postalCode',
  no_available_items: 'root',
};

const CREATE_ORDER_ERROR_MESSAGES: Record<CreateOrderError, string> = {
  rate_limited: 'errors.rateLimited',
  invalid_country: 'errors.country.invalid',
  invalid_postal_code: 'errors.postalCode.invalid',
  no_available_items: 'errors.noAvailableItems',
};

// --- Публичный (без requireAdminSession — витрина, ТЗ §5; сессии на момент вызова ещё нет,
// защита от злоупотреблений — rate-limit внутри orders.service.createOrder, не здесь). ---

export async function createOrder(
  input: unknown,
): Promise<ActionResult<{ id: number; unavailableCount: number }>> {
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: zodIssuesToFieldErrors(parsed.error) };
  }

  const result = await ordersService.createOrder(parsed.data);
  if (!result.success) {
    const field = CREATE_ORDER_ERROR_FIELDS[result.error];
    return { success: false, errors: { [field]: CREATE_ORDER_ERROR_MESSAGES[result.error] } };
  }

  return { success: true, data: result.data };
}

// --- Административные (requireAdminSession() первым шагом — architecture.md §3.4 п.2). ---

const orderIdSchema = z.number().int().positive({ error: 'Invalid order id.' });
const orderStatusSchema = z.enum(['new', 'processing', 'done', 'cancelled']);

export async function getOrders(
  filters: GetOrdersFilters = {},
): Promise<{ orders: OrderListItem[]; total: number }> {
  await requireAdminSession();
  return queryGetOrders(filters);
}

export async function getOrder(id: number): Promise<OrderDetail | null> {
  await requireAdminSession();
  return queryGetOrder(id);
}

export async function getNewOrdersCount(): Promise<number> {
  await requireAdminSession();
  return queryGetNewOrdersCount();
}

// REV2 (план Фазы 4): свободная смена статуса на любое из 4 значений enum, без ограничений на
// переходы — ТЗ их не описывает.
export async function updateOrderStatus(id: number, status: unknown): Promise<ActionResult<null>> {
  await requireAdminSession();

  const parsedId = orderIdSchema.safeParse(id);
  const parsedStatus = orderStatusSchema.safeParse(status);
  if (!parsedId.success || !parsedStatus.success) {
    return {
      success: false,
      errors: {
        root: !parsedId.success
          ? parsedId.error.issues[0]!.message
          : parsedStatus.error!.issues[0]!.message,
      },
    };
  }

  await queryUpdateOrderStatus(parsedId.data, parsedStatus.data);
  return { success: true, data: null };
}
