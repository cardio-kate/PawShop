import { z } from 'zod';

// Admin-формы (в т.ч. /staff-entry) — ошибки на английском без ключей перевода, в отличие от
// витринных схем (CLAUDE.md → «Мультиязычность», «Что не локализуется»). Zod v4: кастомизация
// сообщений — параметр `error`, не `message`/`invalid_type_error` из v3 (сверено с node_modules/zod).

export const loginSchema = z.object({
  username: z.string().min(1, { error: 'Username is required' }),
  password: z.string().min(1, { error: 'Password is required' }),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const requestPasswordResetSchema = z.object({
  username: z.string().min(1, { error: 'Username is required' }),
});
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

// Поле формы называется "code" (см. StaffLoginCard — админ вводит код, присланный в Telegram), хотя
// auth.service.ts принимает тот же параметр как "token" — граница между UI-именем и внутренним
// именем в services сознательная, схема отражает то, что реально вводит пользователь.
export const resetPasswordSchema = z.object({
  code: z.string().min(1, { error: 'Reset code is required' }),
  newPassword: z.string().min(8, { error: 'Password must be at least 8 characters' }),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
