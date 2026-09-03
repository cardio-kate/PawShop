import 'server-only';
import { after } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { createContactMessage } from '@/lib/db/queries/contact.queries';
import { getAdminTelegramChatId } from '@/lib/db/queries/admin.queries';
import { sendContactNotification } from '@/lib/telegram';
import type { ContactInput } from '@/lib/validation/contact.schema';

// Фаза 7 плана: заявка сохраняется в Postgres как источник истины (не теряется, если Telegram
// недоступен); Telegram — опциональный алерт поверх, тем же принципом try/catch, что orders.
// service.createOrder — сбой уведомления не должен откатывать уже сохранённую заявку.

export type SubmitContactMessageError = 'rate_limited';

export type SubmitContactMessageResult =
  | { success: true; data: { id: number } }
  | { success: false; error: SubmitContactMessageError };

export async function submitContactMessage(
  input: ContactInput,
): Promise<SubmitContactMessageResult> {
  // architecture.md §3.8: проверка первым шагом, до любой мутации — тот же общий IP-бюджет, что у
  // createOrder/requestPasswordReset (lib/rate-limit.ts не различает вызывающий action).
  const rateLimitResult = await checkRateLimit();
  if (!rateLimitResult.allowed) {
    return { success: false, error: 'rate_limited' };
  }

  const phone = input.phone?.trim() ? input.phone.trim() : null;
  const comment = input.comment?.trim() ? input.comment.trim() : null;

  const id = await createContactMessage({
    name: input.name,
    email: input.email,
    phone,
    comment,
  });

  // Admin.telegramChatId nullable до тех пор, пока админ не напишет боту вручную (architecture.md
  // §3.4 п.5) — тот же путь, что orders.service.createOrder: логировать и продолжать, не падать.
  //
  // after() — заявка уже сохранена строкой выше; уведомление не должно держать ответ формы контактов
  // на round-trip до Telegram Bot API, тот же принцип и та же причина, что в orders.service.
  // createOrder (см. комментарий там).
  after(async () => {
    const chatId = await getAdminTelegramChatId();
    if (chatId) {
      try {
        await sendContactNotification(chatId, { id, name: input.name, email: input.email, phone, comment });
      } catch (error) {
        console.error('contact.service.submitContactMessage: sendContactNotification failed', error);
      }
    } else {
      console.error('contact.service.submitContactMessage: Admin.telegramChatId is not set yet');
    }
  });

  return { success: true, data: { id } };
}
