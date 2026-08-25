import { config } from 'dotenv';
config({ path: '.env.local' });

// Разовый запуск (npm run seed:delivery-countries) — все 27 стран ЕС
// (.claude/plans/backend-realization-pawshop.md → «Блокеры до старта» → «Бизнес-данные», пункт 1).
// Источник цифр: 12 стран — из components/product/mock-data.ts → MOCK_DELIVERY_COUNTRIES,
// остальные 15 — оценка по географической зоне/удалённости от Германии, ждёт подтверждения
// реальными тарифами перевозчика. Правка цифр после запуска — updateDeliveryCountry в админке
// (CLAUDE.md → «Осознанно НЕ реализуется»), не повторный сид с другими значениями.
// ON CONFLICT (country_name) DO NOTHING — та же защита от повторного запуска, что у
// scripts/seed-categories.ts.
//
// Статический import lib/db хостится выше config() из dotenv — импортируется динамически внутри
// main(), после того как config() гарантированно отработал (тот же приём, что в
// scripts/seed-categories.ts/create-admin.ts).

const DELIVERY_COUNTRIES: { countryName: string; price: string; estimatedDays: string }[] = [
  // Из MOCK_DELIVERY_COUNTRIES — уже согласованный дизайнерский мок, взят как реальный прайс-лист.
  { countryName: 'Germany', price: '4.90', estimatedDays: '2–4' },
  { countryName: 'Austria', price: '5.90', estimatedDays: '3–5' },
  { countryName: 'France', price: '7.90', estimatedDays: '3–5' },
  { countryName: 'Netherlands', price: '6.90', estimatedDays: '2–4' },
  { countryName: 'Belgium', price: '6.90', estimatedDays: '2–4' },
  { countryName: 'Italy', price: '8.90', estimatedDays: '4–6' },
  { countryName: 'Spain', price: '9.90', estimatedDays: '4–6' },
  { countryName: 'Poland', price: '6.90', estimatedDays: '3–5' },
  { countryName: 'Czech Republic', price: '7.90', estimatedDays: '3–5' },
  { countryName: 'Ireland', price: '10.90', estimatedDays: '4–7' },
  { countryName: 'Sweden', price: '11.90', estimatedDays: '4–7' },
  { countryName: 'Denmark', price: '9.90', estimatedDays: '3–6' },
  // Остальные 15 стран ЕС — оценка по зоне, ждёт подтверждения реальными тарифами перевозчика.
  { countryName: 'Luxembourg', price: '5.90', estimatedDays: '2–4' },
  { countryName: 'Slovakia', price: '7.90', estimatedDays: '3–5' },
  { countryName: 'Slovenia', price: '7.90', estimatedDays: '3–5' },
  { countryName: 'Hungary', price: '7.90', estimatedDays: '3–5' },
  { countryName: 'Croatia', price: '8.90', estimatedDays: '4–6' },
  { countryName: 'Portugal', price: '9.90', estimatedDays: '4–6' },
  { countryName: 'Finland', price: '11.90', estimatedDays: '4–7' },
  { countryName: 'Estonia', price: '10.90', estimatedDays: '4–7' },
  { countryName: 'Latvia', price: '10.90', estimatedDays: '4–7' },
  { countryName: 'Lithuania', price: '10.90', estimatedDays: '4–7' },
  { countryName: 'Greece', price: '10.90', estimatedDays: '5–7' },
  { countryName: 'Romania', price: '10.90', estimatedDays: '5–7' },
  { countryName: 'Bulgaria', price: '10.90', estimatedDays: '5–7' },
  { countryName: 'Cyprus', price: '12.90', estimatedDays: '5–8' },
  { countryName: 'Malta', price: '12.90', estimatedDays: '5–8' },
];

async function main(): Promise<void> {
  const { dbHttp } = await import('@/lib/db');
  const { deliveryCountry } = await import('@/lib/db/schema');

  const inserted = await dbHttp
    .insert(deliveryCountry)
    .values(DELIVERY_COUNTRIES)
    .onConflictDoNothing({ target: deliveryCountry.countryName })
    .returning({ countryName: deliveryCountry.countryName });

  const insertedNames = new Set(inserted.map((row) => row.countryName));
  const skipped = DELIVERY_COUNTRIES.filter((c) => !insertedNames.has(c.countryName)).map(
    (c) => c.countryName,
  );

  console.log(
    `scripts/seed-delivery-countries.ts: inserted ${inserted.length} countr${inserted.length === 1 ? 'y' : 'ies'}.`,
  );
  if (skipped.length > 0) {
    console.log(
      `scripts/seed-delivery-countries.ts: skipped (already exist): ${skipped.join(', ')}.`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('scripts/seed-delivery-countries.ts: failed', error);
    process.exit(1);
  });
