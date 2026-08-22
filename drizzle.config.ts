// 'dotenv/config' по умолчанию грузит только .env, которого в проекте нет — переменные лежат в
// .env.local (как и в остальном проекте, next dev грузит его сам, а вот drizzle-kit — нет).
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });

// DATABASE_URL_UNPOOLED, не DATABASE_URL — пул-коннектор Neon не поддерживает
// session-level команды, нужные drizzle-kit при миграциях (docs/architecture.md, раздел 5).
export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
});
