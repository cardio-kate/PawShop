import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';

// Обязательный guard перед TRUNCATE (docs/architecture.md §7.1): без него отсутствие
// DATABASE_URL_TEST или случайное совпадение с DATABASE_URL/DATABASE_URL_UNPOOLED — самый вероятный
// способ стереть dev/prod-базу «по удобству». Оба случая — throw, без фолбэков.
function assertTestDatabaseUrl(): string {
  const testUrl = process.env.DATABASE_URL_TEST;
  if (!testUrl) {
    throw new Error(
      'tests/helpers/reset-db.ts: DATABASE_URL_TEST is not set. Integration tests refuse to run ' +
        'without an explicit test database — see docs/architecture.md §7.1.',
    );
  }
  if (testUrl === process.env.DATABASE_URL || testUrl === process.env.DATABASE_URL_UNPOOLED) {
    throw new Error(
      'tests/helpers/reset-db.ts: DATABASE_URL_TEST matches DATABASE_URL/DATABASE_URL_UNPOOLED. ' +
        'Refusing to TRUNCATE what looks like the dev/prod database.',
    );
  }
  return testUrl;
}

let testDb: ReturnType<typeof drizzle<typeof schema>> | undefined;

function getTestDb() {
  testDb ??= drizzle(neon(assertTestDatabaseUrl()), { schema });
  return testDb;
}

// Одна строка на все 8 таблиц — CASCADE снимает необходимость думать о порядке FK.
// RESTART IDENTITY — id-последовательности тоже сбрасываются, тесты не зависят от того, что
// было создано в предыдущих прогонах.
export async function resetDb(): Promise<void> {
  await getTestDb().execute(sql`
    TRUNCATE TABLE
      categories, products, product_variants,
      delivery_countries, orders, order_items,
      admins, rate_limit
    RESTART IDENTITY CASCADE
  `);
}
