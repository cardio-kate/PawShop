import 'server-only';
import { neon, Pool } from '@neondatabase/serverless';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePool } from 'drizzle-orm/neon-serverless';
import * as schema from '@/lib/db/schema';

// Оба клиента используют DATABASE_URL (пулированное подключение) — DATABASE_URL_UNPOOLED нужен
// только drizzle-kit при миграциях (см. drizzle.config.ts, docs/architecture.md §5).
const connectionString = process.env.DATABASE_URL!;

// neon-http — для всех read-запросов (каталог, доставка, чтение заказов): быстрее, дешевле,
// транзакция не нужна. Не поддерживает db.transaction() вообще (docs/architecture.md §4).
export const dbHttp = drizzleHttp(neon(connectionString), { schema });

// neon-serverless (Pool, WebSocket) — только там, где нужна атомарность записи: Order+OrderItem[]
// одной транзакцией, обновление failedLoginAttempts/lockedUntil (docs/architecture.md §4).
const pool = new Pool({ connectionString });
export const dbPool = drizzlePool(pool, { schema });
