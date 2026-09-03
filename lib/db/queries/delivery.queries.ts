import 'server-only';
import { unstable_cache } from 'next/cache';
import { asc, eq } from 'drizzle-orm';
import { dbHttp } from '@/lib/db';
import { deliveryCountry } from '@/lib/db/schema';

// Только SQL, без бизнес-условий (CLAUDE.md → «Слои») — тут их и нет: updateDeliveryCountry не
// проверяет ничего сложнее того, что уже покрывает Zod (delivery.schema.ts), поэтому, как и у
// getCategories() (architecture.md §3.7), отдельного delivery.service.ts в этой фазе нет —
// .claude/plans/backend-realization-pawshop.md, Фаза 3, перечисляет только queries/schema/actions.
//
// getDeliveryCountries/getAdminDeliveryCountries — unstable_cache, тег 'delivery'
// (architecture.md §3.9/§3.1), без TTL: инвалидация только через revalidateTag('delivery') из
// delivery.actions.ts → updateDeliveryCountry, мгновенно, не по истечении TTL. Тот же режим
// (без cacheComponents), что и в products.queries.ts — см. комментарий там.

export interface DeliveryCountryRow {
  id: number;
  countryName: string;
  price: string;
  estimatedDays: string;
  isActive: boolean;
}

// Публичная витрина (/delivery, CheckoutClient) — только активные страны, алфавитный порядок
// (предсказуемый список в <select>/таблице, не порядок вставки сид-скрипта).
const getDeliveryCountriesUncached = async (): Promise<DeliveryCountryRow[]> => {
  return dbHttp
    .select()
    .from(deliveryCountry)
    .where(eq(deliveryCountry.isActive, true))
    .orderBy(asc(deliveryCountry.countryName));
};

export const getDeliveryCountries = unstable_cache(
  getDeliveryCountriesUncached,
  ['delivery-countries'],
  { tags: ['delivery'] },
);

// Админ (DeliveryTable) — все страны независимо от isActive, тот же алфавитный порядок.
const getAdminDeliveryCountriesUncached = async (): Promise<DeliveryCountryRow[]> => {
  return dbHttp.select().from(deliveryCountry).orderBy(asc(deliveryCountry.countryName));
};

export const getAdminDeliveryCountries = unstable_cache(
  getAdminDeliveryCountriesUncached,
  ['admin-delivery-countries'],
  { tags: ['delivery'] },
);

// orders.service.ts (createOrder) — пересчитывает shippingPriceAtOrder из этой строки, не из
// клиентского значения (CLAUDE.md → «Заказ и корзина»), и читает countryName для country-specific
// проверки индекса (order.schema.ts → EIRCODE_PATTERN). Независимо от isActive — сама проверка
// "страна всё ещё активна" остаётся решением orders.service.ts, не этого запроса.
export async function getDeliveryCountryById(id: number): Promise<DeliveryCountryRow | null> {
  const [row] = await dbHttp
    .select()
    .from(deliveryCountry)
    .where(eq(deliveryCountry.id, id))
    .limit(1);
  return row ?? null;
}

export interface DeliveryCountryWriteData {
  price: string;
  estimatedDays: string;
  isActive: boolean;
}

export async function updateDeliveryCountry(
  id: number,
  data: DeliveryCountryWriteData,
): Promise<void> {
  await dbHttp.update(deliveryCountry).set(data).where(eq(deliveryCountry.id, id));
}
