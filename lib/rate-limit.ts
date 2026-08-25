import 'server-only';
import { headers } from 'next/headers';
import { lt, sql } from 'drizzle-orm';
import { dbHttp } from '@/lib/db';
import { rateLimit } from '@/lib/db/schema';
import { RATE_LIMIT_WINDOW_MINUTES, RATE_LIMIT_MAX_REQUESTS } from '@/lib/constants';

// Фиксированное окно (architecture.md §3.8, дизайн зафиксирован в Фазе 0): одна строка на
// (ip, windowStart) — windowStart округлён вниз до длины окна, не строка на каждую попытку.
// Проверка лимита — атомарный upsert (INSERT ... ON CONFLICT (ip, window_start) DO UPDATE
// SET count = count + 1 RETURNING count), сравнение с порогом уже после записи: наивное
// «прочитать счётчик → сравнить → записать» в JS позволяет двум параллельным запросам с одного IP
// синхронно пройти проверку и не увеличить счётчик (тот же класс гонки, что recordFailedLoginAttempt
// в admin.queries.ts). Таблица не различает вызывающий action — один общий бюджет на IP разом на
// createOrder и requestPasswordReset, по дизайну (ip, windowStart) без отдельной колонки под action.

const WINDOW_MS = RATE_LIMIT_WINDOW_MINUTES * 60_000;

function currentWindowStart(): Date {
  return new Date(Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS);
}

// x-forwarded-for может нести цепочку "client, proxy1, proxy2" — берёт первый адрес. 'unknown' как
// фоллбэк, не throw — публичный action не должен падать целиком из-за отсутствующего заголовка
// (например, локальная разработка без прокси перед Next.js); такие запросы просто делят один бюджет.
async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  return forwardedFor?.split(',')[0]?.trim() || 'unknown';
}

// Лёгкая чистка окон старше текущего лимита при каждой проверке (architecture.md §3.8) — не
// отдельная cron-задача, иначе таблица растёт без предела на каждую попытку оформления заказа/
// сброса пароля, включая заблокированные. Не влияет на атомарность upsert ниже: строки других IP/
// прошлых окон не участвуют в подсчёте текущего (ip, windowStart) в любом случае.
async function cleanupExpiredWindows(): Promise<void> {
  const cutoff = new Date(Date.now() - WINDOW_MS);
  await dbHttp.delete(rateLimit).where(lt(rateLimit.windowStart, cutoff));
}

export type RateLimitResult = { allowed: true } | { allowed: false };

// Вызывается в начале orders.service.ts (createOrder) и auth.service.ts (requestPasswordReset) до
// мутации — при превышении лимита вызывающая сторона не должна создавать заказ/генерировать
// resetToken/обращаться к Telegram.
export async function checkRateLimit(): Promise<RateLimitResult> {
  const ip = await getClientIp();
  const windowStart = currentWindowStart();

  await cleanupExpiredWindows();

  const [row] = await dbHttp
    .insert(rateLimit)
    .values({ ip, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimit.ip, rateLimit.windowStart],
      set: { count: sql`${rateLimit.count} + 1` },
    })
    .returning({ count: rateLimit.count });

  if (!row) {
    throw new Error('lib/rate-limit.ts: upsert returned no row');
  }

  return row.count <= RATE_LIMIT_MAX_REQUESTS ? { allowed: true } : { allowed: false };
}
