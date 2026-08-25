import { config } from 'dotenv';
config({ path: '.env.local' });

// Разовый запуск (npm run seed:categories) — 4 фиксированные категории из ТЗ §4, менять из
// админ-панели нельзя (CLAUDE.md → «Осознанно НЕ реализуется»). ON CONFLICT (slug) DO NOTHING —
// защита от повторного запуска на уже засеянной/пересозданной БД, не полагаться на то, что скрипт
// просто не запустят дважды (та же защита, что у scripts/create-admin.ts).
//
// Статический import lib/db хостится выше config() из dotenv, даже если текстуально написан позже
// — поэтому импортируется динамически внутри main(), после того как config() гарантированно
// отработал (тот же приём, что в create-admin.ts).

const CATEGORIES: { nameEn: string; nameDe: string; slug: string }[] = [
  { nameEn: 'Dry food', nameDe: 'Trockenfutter', slug: 'dry-food' },
  { nameEn: 'Wet food', nameDe: 'Nassfutter', slug: 'wet-food' },
  { nameEn: 'Treats', nameDe: 'Leckerlis', slug: 'treats' },
  { nameEn: 'Accessories', nameDe: 'Zubehör', slug: 'accessories' },
];

async function main(): Promise<void> {
  const { dbHttp } = await import('@/lib/db');
  const { category } = await import('@/lib/db/schema');

  const inserted = await dbHttp
    .insert(category)
    .values(CATEGORIES)
    .onConflictDoNothing({ target: category.slug })
    .returning({ slug: category.slug });

  const insertedSlugs = new Set(inserted.map((row) => row.slug));
  const skipped = CATEGORIES.filter((c) => !insertedSlugs.has(c.slug)).map((c) => c.slug);

  console.log(
    `scripts/seed-categories.ts: inserted ${inserted.length} categor${inserted.length === 1 ? 'y' : 'ies'}.`,
  );
  if (skipped.length > 0) {
    console.log(`scripts/seed-categories.ts: skipped (already exist): ${skipped.join(', ')}.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('scripts/seed-categories.ts: failed', error);
    process.exit(1);
  });
