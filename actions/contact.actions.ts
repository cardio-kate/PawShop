'use server';

import { z } from 'zod';
import { requireAdminSession } from '@/lib/auth';
import * as contactService from '@/lib/services/contact.service';
import { contactSchema } from '@/lib/validation/contact.schema';
import {
  getAdminContactMessages as queryGetAdminContactMessages,
  type ContactMessageListItem,
  type GetAdminContactMessagesFilters,
} from '@/lib/db/queries/contact.queries';
import type { SubmitContactMessageError } from '@/lib/services/contact.service';

// Фаза 7 плана: submitContactMessage — публичный (без requireAdminSession — форма доступна без
// сессии по конструкции, тот же класс, что createOrder/requestPasswordReset). getAdminContactMessages
// добавлен по отдельному решению от 2026-08-29 (просмотр заявок в дашборде, только чтение).

type ActionResult<T> =
  { success: true; data: T } | { success: false; errors: Record<string, string> };

// Дублирует products.actions.ts/delivery.actions.ts/orders.actions.ts/auth.actions.ts — тот же
// паттерн в пятом файле подряд, вынос в общий helper по-прежнему не часть этой фазы.
function zodIssuesToFieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : 'root';
    errors[key] ??= issue.message;
  }
  return errors;
}

const SUBMIT_CONTACT_MESSAGE_ERRORS: Record<SubmitContactMessageError, string> = {
  rate_limited: 'errors.rateLimited',
};

export async function submitContactMessage(input: unknown): Promise<ActionResult<{ id: number }>> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: zodIssuesToFieldErrors(parsed.error) };
  }

  const result = await contactService.submitContactMessage(parsed.data);
  if (!result.success) {
    return { success: false, errors: { root: SUBMIT_CONTACT_MESSAGE_ERRORS[result.error] } };
  }

  return { success: true, data: result.data };
}

// --- Административный (requireAdminSession() первым шагом — architecture.md §3.4 п.2). ---

export async function getAdminContactMessages(
  filters: GetAdminContactMessagesFilters = {},
): Promise<{ messages: ContactMessageListItem[]; total: number }> {
  await requireAdminSession();
  return queryGetAdminContactMessages(filters);
}
