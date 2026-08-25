'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decodeJwt } from 'jose';
import type { z } from 'zod';
import { requireAdminSession } from '@/lib/auth';
import { ADMIN_SESSION_COOKIE } from '@/lib/constants';
import * as authService from '@/lib/services/auth.service';
import { loginSchema, requestPasswordResetSchema, resetPasswordSchema } from '@/lib/validation/auth.schema';

type ActionResult<T> = { success: true; data: T } | { success: false; errors: Record<string, string> };

// Литеральный путь дашборда живёт только здесь (сервер), не в клиентском router.replace() —
// иначе адрес попал бы в JS-бандл /staff-entry, который отдаётся любому анонимному посетителю
// страницы входа ещё до ввода пароля.
const ADMIN_DASHBOARD_PATH = '/nine-lives/dashboard/products';

// Одна ошибка на поле (первый issue с этим path) — этого достаточно для setError(field, {message}) /
// setError('root', {message}) на клиенте (architecture.md §3.11); path пустой массив (ошибки схемы
// верхнего уровня) мапится на 'root'.
function zodIssuesToFieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : 'root';
    errors[key] ??= issue.message;
  }
  return errors;
}

// Единое сообщение при неверных данных, отдельное — только при реальной блокировке (ТЗ §7.7: «При
// превышении лимита неудачных попыток входа — сообщение о временной блокировке»); security-review §4
// требует не давать понять, что именно неверно — логин или пароль.
export async function adminLogin(input: unknown): Promise<ActionResult<null>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: zodIssuesToFieldErrors(parsed.error) };
  }

  const result = await authService.login(parsed.data.username, parsed.data.password);
  if (!result.success) {
    const message =
      result.error === 'locked'
        ? 'Too many failed attempts. Try again in 15 minutes.'
        : 'Invalid username or password.';
    return { success: false, errors: { root: message } };
  }

  // expires берётся из самого подписанного токена (exp claim), а не из отдельного хардкода — иначе
  // время жизни cookie и JWT_EXPIRES_IN могут незаметно разъехаться.
  const { exp } = decodeJwt(result.token);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, result.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: exp ? new Date(exp * 1000) : undefined,
  });

  // redirect() имеет тип never и не должен вызываться внутри try/catch на стороне action (Next.js
  // requires calling it outside try/catch) — этот action его не использует, ограничение не задето.
  redirect(ADMIN_DASHBOARD_PATH);
}

// Единственный admin action этой фазы — requireAdminSession() здесь не для защиты бизнес-данных (их
// тут нет), а потому что это первая реальная точка, где растущий тест «requireAdminSession()
// отклоняет вызов независимо от proxy.ts» (architecture.md §7) получает свой первый кейс.
//
// Возврат — Promise<never>, не ActionResult<null>: у этого action нет "мягкого" провала, который
// стоило бы показать пользователю полем формы (requireAdminSession() либо пропускает, либо бросает
// — нештатный путь по её собственному контракту), а успех всегда завершается redirect() на сервере.
export async function adminLogout(): Promise<never> {
  await requireAdminSession();

  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);

  redirect('/staff-entry');
}

// Публичный action без сессии по конструкции — rate-limit по IP теперь проверяется внутри
// authService.requestPasswordReset (lib/rate-limit.ts, retrofit вместе с Фазой 4/createOrder,
// CLAUDE.md → «Заказ и корзина»). success:true при найденном/не найденном username одинаково —
// auth.service.ts уже не даёт сигнала по разнице ответа, действие лишь пробрасывает это наружу;
// rate_limited — единственная ветка, различимая для клиента (root-ошибка, не поле формы).
export async function requestPasswordReset(input: unknown): Promise<ActionResult<null>> {
  const parsed = requestPasswordResetSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: zodIssuesToFieldErrors(parsed.error) };
  }

  const result = await authService.requestPasswordReset(parsed.data.username);
  if (!result.success) {
    return {
      success: false,
      errors: { root: 'Too many attempts. Please try again later.' },
    };
  }

  return { success: true, data: null };
}

export async function resetPassword(input: unknown): Promise<ActionResult<null>> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: zodIssuesToFieldErrors(parsed.error) };
  }

  const result = await authService.resetPassword(parsed.data.code, parsed.data.newPassword);
  if (!result.success) {
    return { success: false, errors: { root: 'This reset code is invalid or has expired.' } };
  }

  return { success: true, data: null };
}
