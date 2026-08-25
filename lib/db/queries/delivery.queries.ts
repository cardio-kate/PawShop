import 'server-only';
import { asc, eq } from 'drizzle-orm';
import { dbHttp } from '@/lib/db';
import { deliveryCountry } from '@/lib/db/schema';

// Только SQL, без бизнес-условий (CLAUDE.md → «Слои») — тут их и нет: updateDeliveryCountry не
// проверяет ничего сложнее того, что уже покрывает Zod (delivery.schema.ts), поэтому, как и у
// getCategories() (architecture.md §3.7), отдельного delivery.service.ts в этой фазе нет —
// .claude/plans/backend-realization-pawshop.md, Фаза 3, перечисляет только queries/schema/actions.

export interface DeliveryCountryRow {
  id: number;
  countryName: string;
  price: string;
  estimatedDays: string;
  isActive: boolean;
}

// Публичная витрина (/delivery, CheckoutClient) — только активные страны, алфавитный порядок
// (предсказуемый список в <select>/таблице, не порядок вставки сид-скрипта).
export async function getDeliveryCountries(): Promise<DeliveryCountryRow[]> {
  return dbHttp
    .select()
    .from(deliveryCountry)
    .where(eq(deliveryCountry.isActive, true))
    .orderBy(asc(deliveryCountry.countryName));
}

// Админ (DeliveryTable) — все страны независимо от isActive, тот же алфавитный порядок.
export async function getAdminDeliveryCountries(): Promise<DeliveryCountryRow[]> {
  return dbHttp.select().from(deliveryCountry).orderBy(asc(deliveryCountry.countryName));
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
