import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

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
