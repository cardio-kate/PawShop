import 'server-only';
import { desc, sql } from 'drizzle-orm';
import { dbHttp } from '@/lib/db';
import { contactMessage } from '@/lib/db/schema';
import { ADMIN_PAGE_SIZE } from '@/lib/constants';

export interface ContactMessageWriteData {
  name: string;
  email: string;
  phone: string | null;
  comment: string | null;
}

export async function createContactMessage(data: ContactMessageWriteData): Promise<number> {
  const [row] = await dbHttp
    .insert(contactMessage)
    .values(data)
    .returning({ id: contactMessage.id });
  if (!row) {
    throw new Error('contact.queries.createContactMessage: insert returned no row');
  }
  return row.id;
}

export interface ContactMessageListItem {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  comment: string | null;
  createdAt: Date;
}

export interface GetAdminContactMessagesFilters {
  limit?: number;
  offset?: number;
}

// Только чтение — по решению пользователя от 2026-08-29 (.claude/plans/backend-realization-pawshop.md
// → Фаза 7 STATUS) заявки просматриваются в дашборде, но без действий над ними (нет detail-страницы,
// нет статуса/пометки "прочитано"). Нет публичного аналога этого query (в отличие от getOrders/
// getAdminProducts) — единственный вызывающий это action, поэтому дефолт limit — ADMIN_PAGE_SIZE, не
// CATALOG_PAGE_SIZE.
export async function getAdminContactMessages(
  filters: GetAdminContactMessagesFilters = {},
): Promise<{ messages: ContactMessageListItem[]; total: number }> {
  const limit = filters.limit ?? ADMIN_PAGE_SIZE;
  const offset = filters.offset ?? 0;

  const rows = await dbHttp
    .select({
      id: contactMessage.id,
      name: contactMessage.name,
      email: contactMessage.email,
      phone: contactMessage.phone,
      comment: contactMessage.comment,
      createdAt: contactMessage.createdAt,
      // Тот же паттерн, что getOrders/getAdminProducts (products.queries.ts) — count(*) over()
      // приходит вместе со строками текущей страницы, отдельный COUNT(*) нужен только когда offset
      // указывает за пределы данных (устаревшая ссылка на страницу) и rows пуст.
      matchCount: sql<number>`count(*) over()`.mapWith(Number),
    })
    .from(contactMessage)
    .orderBy(desc(contactMessage.createdAt))
    .limit(limit)
    .offset(offset);

  let total = rows[0]?.matchCount;
  if (total === undefined && offset > 0) {
    const [countRow] = await dbHttp
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(contactMessage);
    total = countRow?.count ?? 0;
  }

  return {
    messages: rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      comment: row.comment,
      createdAt: row.createdAt,
    })),
    total: total ?? 0,
  };
}
