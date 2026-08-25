import 'server-only';
import { and, desc, eq, sql } from 'drizzle-orm';
import { dbHttp, dbPool } from '@/lib/db';
import { order, orderItem } from '@/lib/db/schema';
import { CATALOG_PAGE_SIZE } from '@/lib/constants';
import type { OrderStatus } from '@/types';

// Только SQL, без бизнес-условий (CLAUDE.md → «Слои») — пересчёт суммы, исключение недоступных
// позиций, выбор получателя Telegram-уведомления — забота orders.service.ts, не этого файла.
// Без unstable_cache/revalidateTag (в отличие от products.queries.ts/delivery.queries.ts) —
// architecture.md/план Фазы 4: для заказов нет тега инвалидации, обёртка в кэш завела бы счётчик
// новых заказов в сайдбаре админки, который никогда не обновлялся бы.

export interface OrderItemWriteData {
  productId: number;
  variantId: number;
  quantity: number;
  priceAtOrder: string;
  productNameAtOrder: string;
  variantLabelAtOrder: string;
}

export interface OrderWriteData {
  customerName: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  deliveryCountryId: number;
  shippingPriceAtOrder: string;
  comment: string | null;
}

// Order + OrderItem[] в одной транзакции через dbPool (CLAUDE.md → «База данных»): neon-http не
// поддерживает db.transaction() вообще — без атомарности сбой между вставками оставил бы в базе
// Order без единого OrderItem.
export async function createOrderWithItems(
  data: OrderWriteData,
  items: OrderItemWriteData[],
): Promise<number> {
  return dbPool.transaction(async (tx) => {
    const [row] = await tx.insert(order).values(data).returning({ id: order.id });
    if (!row) {
      throw new Error('orders.queries.createOrderWithItems: insert returned no row');
    }
    await tx.insert(orderItem).values(items.map((item) => ({ ...item, orderId: row.id })));
    return row.id;
  });
}

// --- Админ (architecture.md §4 «Пагинация»: тот же limit/offset-паттерн, что getProducts/
// getAdminProducts, включая переиспользование CATALOG_PAGE_SIZE как дефолта — REV2: UI-фильтров под
// заказы пока не задано отдельно, ограничиваемся status/limit/offset по аналогии с getProducts). ---

export interface GetOrdersFilters {
  status?: OrderStatus;
  limit?: number;
  offset?: number;
}

export interface OrderListItem {
  id: number;
  customerName: string;
  phone: string;
  status: OrderStatus;
  shippingPriceAtOrder: string;
  createdAt: Date;
}

export async function getOrders(
  filters: GetOrdersFilters = {},
): Promise<{ orders: OrderListItem[]; total: number }> {
  const limit = filters.limit ?? CATALOG_PAGE_SIZE;
  const offset = filters.offset ?? 0;
  const conditions = filters.status ? [eq(order.status, filters.status)] : [];

  const rows = await dbHttp
    .select({
      id: order.id,
      customerName: order.customerName,
      phone: order.phone,
      status: order.status,
      shippingPriceAtOrder: order.shippingPriceAtOrder,
      createdAt: order.createdAt,
      total: sql<number>`count(*) over()`.mapWith(Number),
    })
    .from(order)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(order.createdAt))
    .limit(limit)
    .offset(offset);

  // count(*) over() приходит только вместе со строками — на странице за пределами total
  // (устаревший offset после смены фильтра) rows пуст, total нужно достать отдельным COUNT(*),
  // тот же паттерн, что getProducts/getAdminProducts в products.queries.ts.
  let total = rows[0]?.total;
  if (total === undefined && offset > 0) {
    const [countRow] = await dbHttp
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(order)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    total = countRow?.count ?? 0;
  }

  return {
    orders: rows.map((row) => {
      // total дропается намеренно из элементов списка, уже прочитан отдельно выше.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { total, ...listItem } = row;
      return listItem;
    }),
    total: total ?? 0,
  };
}

export interface OrderItemRow {
  id: number;
  productId: number | null;
  variantId: number | null;
  quantity: number;
  priceAtOrder: string;
  productNameAtOrder: string;
  variantLabelAtOrder: string;
}

export interface OrderDetail {
  id: number;
  customerName: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  deliveryCountryId: number | null;
  shippingPriceAtOrder: string;
  comment: string | null;
  status: OrderStatus;
  createdAt: Date;
  items: OrderItemRow[];
}

export async function getOrder(id: number): Promise<OrderDetail | null> {
  const [row] = await dbHttp.select().from(order).where(eq(order.id, id)).limit(1);
  if (!row) return null;

  const items = await dbHttp
    .select({
      id: orderItem.id,
      productId: orderItem.productId,
      variantId: orderItem.variantId,
      quantity: orderItem.quantity,
      priceAtOrder: orderItem.priceAtOrder,
      productNameAtOrder: orderItem.productNameAtOrder,
      variantLabelAtOrder: orderItem.variantLabelAtOrder,
    })
    .from(orderItem)
    .where(eq(orderItem.orderId, id));

  return { ...row, items };
}

// Счётчик в сайдбаре админки (ТЗ §5 getNewOrdersCount) — намеренно без кэша, см. комментарий вверху
// файла.
export async function getNewOrdersCount(): Promise<number> {
  const [row] = await dbHttp
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(order)
    .where(eq(order.status, 'new'));
  return row?.count ?? 0;
}

// REV2 (план Фазы 4): свободная смена статуса на любое из 4 значений enum, без state machine —
// ТЗ не описывает ограничений на переходы.
export async function updateOrderStatus(id: number, status: OrderStatus): Promise<void> {
  await dbHttp.update(order).set({ status }).where(eq(order.id, id));
}
