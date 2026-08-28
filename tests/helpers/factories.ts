import { hashPassword } from '@/lib/auth';
import { getTestDb } from '@/tests/helpers/reset-db';
import * as schema from '@/lib/db/schema';

// Билдеры по одному на сущность, которая попадает в интеграционные тесты (docs/architecture.md
// §7.4). Каждый вставляет строку напрямую через тестовый drizzle-клиент (не через
// products.service.ts/orders.service.ts — те несут бизнес-правила, которые сами являются предметом
// тестов, факторки должны уметь создавать и невалидные с точки зрения сервиса состояния для
// setup'а) и возвращает вставленную строку целиком (с id) — точечное переопределение полей через
// Partial. RESTART IDENTITY в resetDb() (tests/helpers/reset-db.ts) сбрасывает id-последовательности
// перед каждым тестом, поэтому дефолтные slug/username ниже не обязаны быть глобально уникальными
// в реальном времени — достаточно уникальности внутри одного теста.

let uniqueCounter = 0;
function unique(prefix: string): string {
  uniqueCounter += 1;
  return `${prefix}-${uniqueCounter}`;
}

export async function buildCategory(
  overrides: Partial<typeof schema.category.$inferInsert> = {},
) {
  const [row] = await getTestDb()
    .insert(schema.category)
    .values({
      nameEn: 'Dry food',
      nameDe: 'Trockenfutter',
      slug: unique('category'),
      ...overrides,
    })
    .returning();
  return row!;
}

// categoryId не переопределён — создаёт свою категорию по умолчанию, чтобы не заставлять каждый
// тест, которому не важна конкретная категория, писать buildCategory() отдельной строкой.
export async function buildProduct(overrides: Partial<typeof schema.product.$inferInsert> = {}) {
  const categoryId = overrides.categoryId ?? (await buildCategory()).id;
  const [row] = await getTestDb()
    .insert(schema.product)
    .values({
      categoryId,
      slug: unique('product'),
      nameEn: 'Test product',
      nameDe: null,
      descriptionEn: 'Test description',
      descriptionDe: null,
      composition: null,
      analyticalConstituents: null,
      flavor: null,
      ageGroup: 'adult',
      images: ['https://example.com/image.jpg'],
      isNew: false,
      isActive: true,
      ...overrides,
    })
    .returning();
  return row!;
}

// productId обязателен (в отличие от buildProduct/categoryId выше) — вариант без товара не имеет
// смысла даже как fixture, автосоздание скрыло бы опечатку в id в самом тесте.
export async function buildProductVariant(
  productId: number,
  overrides: Partial<Omit<typeof schema.productVariant.$inferInsert, 'productId'>> = {},
) {
  const [row] = await getTestDb()
    .insert(schema.productVariant)
    .values({
      productId,
      label: 'Default',
      price: '9.99',
      isActive: true,
      ...overrides,
    })
    .returning();
  return row!;
}

export async function buildDeliveryCountry(
  overrides: Partial<typeof schema.deliveryCountry.$inferInsert> = {},
) {
  const [row] = await getTestDb()
    .insert(schema.deliveryCountry)
    .values({
      countryName: unique('Testland'),
      price: '5.00',
      estimatedDays: '2-4',
      isActive: true,
      ...overrides,
    })
    .returning();
  return row!;
}

// passwordHash уже реально хешируется через lib/auth.hashPassword — тесты логина должны
// аутентифицироваться настоящим bcrypt.compare, не заглушкой, иначе auth-actions integration-тесты
// проверяли бы только форму данных, а не сам механизм проверки пароля.
export async function buildAdmin(
  overrides: Partial<Omit<typeof schema.admin.$inferInsert, 'passwordHash'>> & {
    password?: string;
  } = {},
) {
  const { password, ...rest } = overrides;
  const passwordHash = await hashPassword(password ?? 'correct-horse-battery-staple');
  const [row] = await getTestDb()
    .insert(schema.admin)
    .values({
      username: unique('admin'),
      passwordHash,
      telegramChatId: '123456789',
      sessionVersion: 0,
      ...rest,
    })
    .returning();
  return row!;
}
