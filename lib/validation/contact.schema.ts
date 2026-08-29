import { z } from 'zod';

// Телефон — необязательное поле здесь (в отличие от Order.phone), но при заполнении проверяется
// тем же мягким международным паттерном, что уже согласован с пользователем для order.schema.ts
// (.claude/plans/backend-realization-pawshop.md → «Блокеры до старта», п.2) — не повод заводить
// свой формат под вторую форму с похожим полем.
const PHONE_PATTERN = /^\+?[0-9\s\-()]{6,20}$/;

// message — ключ перевода ('Contact.errors.…'), не готовая строка (CLAUDE.md → «Мультиязычность»:
// витринные схемы переводятся наравне с остальной витриной). Перевод — useTranslations('Contact')
// в ContactClient через setError(field, { message: t(errors.field) }).
export const contactSchema = z.object({
  name: z.string().min(1, { error: 'errors.name.required' }),
  email: z.email({ error: 'errors.email.invalid' }),
  phone: z
    .string()
    .regex(PHONE_PATTERN, { error: 'errors.phone.invalid' })
    .optional()
    .or(z.literal('')),
  comment: z.string().optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
