import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';

// Обязательный guard перед TRUNCATE (docs/architecture.md §7.1): без него отсутствие
// DATABASE_URL_TEST или случайное совпадение с прод-строкой — самый вероятный способ стереть
// dev/prod-базу «по удобству». Оба случая — throw, без фолбэков.
//
// Сверка идёт с DATABASE_URL_PROD_FOR_GUARD/DATABASE_URL_UNPOOLED_PROD_FOR_GUARD, не с "живыми"
// DATABASE_URL/DATABASE_URL_UNPOOLED — tests/helpers/setup-integration.ts подменяет последние на
// значения DATABASE_URL_TEST/DATABASE_URL_TEST_UNPOOLED ещё до того, как lib/db/index.ts (и через
// него реальные queries/services/actions) успевает их прочитать, чтобы integration-тесты вызывали
// настоящий код приложения против тестовой ветки, а не против прод. Сверка с уже подменённым
// значением была бы сравнением строки с самой собой — guard, "правило" (DATABASE_URL_TEST не должен
// совпадать с настоящим прод-адресом), не с текущим содержимым этой переменной.
function assertTestDatabaseUrl(): string {
  const testUrl = process.env.DATABASE_URL_TEST;
  if (!testUrl) {
    throw new Error(
      'tests/helpers/reset-db.ts: DATABASE_URL_TEST is not set. Integration tests refuse to run ' +
        'without an explicit test database — see docs/architecture.md §7.1.',
    );
  }
  if (
    testUrl === process.env.DATABASE_URL_PROD_FOR_GUARD ||
    testUrl === process.env.DATABASE_URL_UNPOOLED_PROD_FOR_GUARD
  ) {
    throw new Error(
      'tests/helpers/reset-db.ts: DATABASE_URL_TEST matches the real DATABASE_URL/' +
        'DATABASE_URL_UNPOOLED. Refusing to TRUNCATE what looks like the dev/prod database.',
    );
  }
  return testUrl;
}

let testDb: ReturnType<typeof drizzle<typeof schema>> | undefined;

// Экспортируется — tests/helpers/factories.ts переиспользует то же соединение вместо того, чтобы
// заводить второй независимый drizzle-клиент на тестовую ветку.
export function getTestDb() {
  testDb ??= drizzle(neon(assertTestDatabaseUrl()), { schema });
  return testDb;
}

// Одна строка на все 9 таблиц — CASCADE снимает необходимость думать о порядке FK.
// RESTART IDENTITY — id-последовательности тоже сбрасываются, тесты не зависят от того, что
// было создано в предыдущих прогонах.
export async function resetDb(): Promise<void> {
  await getTestDb().execute(sql`
    TRUNCATE TABLE
      categories, products, product_variants,
      delivery_countries, orders, order_items,
      admins, rate_limit, contact_messages
    RESTART IDENTITY CASCADE
  `);
}
