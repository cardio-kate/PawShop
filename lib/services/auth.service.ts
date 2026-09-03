import 'server-only';
import crypto from 'node:crypto';
import { after } from 'next/server';
import { comparePassword, hashPassword, signSession } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendResetCode } from '@/lib/telegram';
import {
  getAdminByUsername,
  getAdminByResetTokenHash,
  recordFailedLoginAttempt,
  resetFailedLoginAttempts,
  setResetToken,
  resetPasswordAndInvalidateSessions,
} from '@/lib/db/queries/admin.queries';
import {
  MAX_FAILED_LOGIN_ATTEMPTS,
  LOGIN_LOCKOUT_MINUTES,
  RESET_TOKEN_TTL_MINUTES,
} from '@/lib/constants';

export type LoginResult =
  | { success: true; token: string }
  | { success: false; error: 'invalid_credentials' | 'locked' };

// Единое сообщение и для "нет такого username", и для "неверный пароль" (security-review §4) —
// вызывающий action не должен различать причины в ответе клиенту.
export async function login(username: string, password: string): Promise<LoginResult> {
  const adminRow = await getAdminByUsername(username);
  if (!adminRow) {
    return { success: false, error: 'invalid_credentials' };
  }

  if (adminRow.lockedUntil && adminRow.lockedUntil.getTime() > Date.now()) {
    return { success: false, error: 'locked' };
  }

  const passwordValid = await comparePassword(password, adminRow.passwordHash);
  if (!passwordValid) {
    await recordFailedLoginAttempt(adminRow.id, MAX_FAILED_LOGIN_ATTEMPTS, LOGIN_LOCKOUT_MINUTES);
    return { success: false, error: 'invalid_credentials' };
  }

  await resetFailedLoginAttempts(adminRow.id);
  const token = await signSession({ adminId: adminRow.id, sessionVersion: adminRow.sessionVersion });
  return { success: true, token };
}

export type RequestPasswordResetResult =
  | { success: true }
  | { success: false; error: 'rate_limited' };

// Публичный action без сессии по конструкции (сессии на момент вызова ещё нет) — не покрывается
// failedLoginAttempts/lockedUntil, тот считает только попытки adminLogin. Без отдельного лимита
// эндпоинт можно долбить, заспамив Telegram единственного админа или исчерпав квоту Bot API
// (architecture.md §3.8) — retrofit того же lib/rate-limit.ts, что и createOrder, ретроактивно к
// уже существующему action из Фазы 1 (план Фазы 4, REV2).
//
// Проверка лимита — первым шагом, до чтения Admin по username: даже сигнал "существует ли аккаунт"
// не должен зависеть от того, успел ли запрос дойти до поиска пользователя.
export async function requestPasswordReset(username: string): Promise<RequestPasswordResetResult> {
  const rateLimitResult = await checkRateLimit();
  if (!rateLimitResult.allowed) {
    return { success: false, error: 'rate_limited' };
  }

  // Всегда { success: true } дальше, даже если username не найден — не давать внешнему наблюдателю
  // сигнал по разнице в ответе, существует ли аккаунт (architecture.md §3.4).
  const adminRow = await getAdminByUsername(username);
  if (!adminRow) {
    return { success: true };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000);

  await setResetToken(adminRow.id, resetTokenHash, resetTokenExpiresAt);

  // Admin.telegramChatId — nullable до тех пор, пока админ не напишет боту вручную (architecture.md
  // §3.4 п.5) — requestPasswordReset не должен падать на этом, а логировать и продолжать (ТЗ §12,
  // «Telegram недоступен»). Тот же try/catch покрывает и сбой самого Telegram Bot API при уже
  // настроенном chatId.
  //
  // after() — resetToken уже сохранён строкой выше; ответ формы сброса пароля не должен ждать
  // round-trip до Telegram Bot API, тот же принцип и та же причина, что в orders.service.createOrder
  // (см. комментарий там).
  after(async () => {
    if (adminRow.telegramChatId) {
      try {
        await sendResetCode(adminRow.telegramChatId, rawToken);
      } catch (error) {
        console.error('auth.service.requestPasswordReset: sendResetCode failed', error);
      }
    } else {
      console.error('auth.service.requestPasswordReset: Admin.telegramChatId is not set yet');
    }
  });

  return { success: true };
}

export type ResetPasswordResult =
  | { success: true }
  | { success: false; error: 'invalid_or_expired_token' };

// TTL проверяется здесь, на момент использования — не только при выдаче резервного токена
// (architecture.md §3.4).
export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<ResetPasswordResult> {
  const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const adminRow = await getAdminByResetTokenHash(resetTokenHash);

  if (
    !adminRow ||
    !adminRow.resetTokenExpiresAt ||
    adminRow.resetTokenExpiresAt.getTime() < Date.now()
  ) {
    return { success: false, error: 'invalid_or_expired_token' };
  }

  const passwordHash = await hashPassword(newPassword);
  await resetPasswordAndInvalidateSessions(adminRow.id, passwordHash);

  return { success: true };
}
