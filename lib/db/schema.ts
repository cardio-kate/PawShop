import 'server-only';
import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

// Единственный источник правды по структуре таблиц (docs/architecture.md §2/§4).
// 7 таблиц из ТЗ §4 + служебная rate_limit (не часть модели данных ТЗ, см. §3.8).

export const ageGroupEnum = pgEnum('age_group', ['kitten', 'adult', 'senior']);
export const orderStatusEnum = pgEnum('order_status', ['new', 'processing', 'done', 'cancelled']);

export const category = pgTable('categories', {
  id: serial('id').primaryKey(),
  nameEn: text('name_en').notNull(),
  nameDe: text('name_de').notNull(), // категорий 4, заводятся сид-скриптом сразу на обоих языках — fallback не нужен (architecture.md §3.10)
  slug: text('slug').notNull().unique(),
});

export const product = pgTable('products', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id')
    .notNull()
    .references(() => category.id),
  slug: text('slug').notNull().unique(),
  nameEn: text('name_en').notNull(),
  nameDe: text('name_de'), // nullable — fallback на nameEn до перевода (architecture.md §3.10)
  descriptionEn: text('description_en').notNull(),
  descriptionDe: text('description_de'),
  flavor: text('flavor'), // не выводится отдельным элементом UI, входит в текст name (ТЗ §4)
  ageGroup: ageGroupEnum('age_group').notNull(),
  images: text('images').array().notNull(),
  isNew: boolean('is_new').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true), // soft delete
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const productVariant = pgTable(
  'product_variants',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id')
      .notNull()
      .references(() => product.id),
    label: text('label').notNull(),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    isActive: boolean('is_active').notNull().default(true), // soft delete / Out of stock
  },
  (table) => [index('product_variants_product_id_idx').on(table.productId)],
);

export const deliveryCountry = pgTable('delivery_countries', {
  id: serial('id').primaryKey(),
  countryName: text('country_name').notNull().unique(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  estimatedDays: text('estimated_days').notNull(),
  isActive: boolean('is_active').notNull().default(true), // soft delete, старые заказы не затрагиваются
});

export const order = pgTable('orders', {
  id: serial('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  phone: text('phone').notNull(),
  street: text('street').notNull(),
  city: text('city').notNull(),
  postalCode: text('postal_code').notNull(),
  deliveryCountryId: integer('delivery_country_id').references(() => deliveryCountry.id, {
    onDelete: 'set null',
  }), // nullable — история заказа держится в snapshot-полях, не пересчитывается (architecture.md §4)
  shippingPriceAtOrder: numeric('shipping_price_at_order', { precision: 10, scale: 2 }).notNull(),
  comment: text('comment'),
  status: orderStatusEnum('status').notNull().default('new'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const orderItem = pgTable(
  'order_items',
  {
    id: serial('id').primaryKey(),
    orderId: integer('order_id')
      .notNull()
      .references(() => order.id, { onDelete: 'cascade' }), // настоящий дочерний ряд Order, не независимая история — в отличие от productId/variantId ниже
    productId: integer('product_id').references(() => product.id, { onDelete: 'set null' }), // nullable — snapshot-поля ниже сохраняют историю независимо от товара
    variantId: integer('variant_id').references(() => productVariant.id, {
      onDelete: 'set null',
    }),
    quantity: integer('quantity').notNull(),
    priceAtOrder: numeric('price_at_order', { precision: 10, scale: 2 }).notNull(),
    productNameAtOrder: text('product_name_at_order').notNull(),
    variantLabelAtOrder: text('variant_label_at_order').notNull(),
  },
  (table) => [
    index('order_items_order_id_idx').on(table.orderId),
    index('order_items_product_id_idx').on(table.productId),
  ],
);

export const admin = pgTable('admins', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  telegramChatId: text('telegram_chat_id'), // nullable — заполняется вручную после create-admin.ts (architecture.md §3.4 п.5)
  resetTokenHash: text('reset_token_hash'), // sha256, не сам токен (architecture.md §3.4)
  resetTokenExpiresAt: timestamp('reset_token_expires_at', { withTimezone: true }),
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  sessionVersion: integer('session_version').notNull().default(0),
});

// Служебная таблица для lib/rate-limit.ts (architecture.md §3.8) — не часть модели данных ТЗ §4.
// Фиксированное окно: одна строка на (ip, windowStart), атомарный upsert-инкремент count.
export const rateLimit = pgTable(
  'rate_limit',
  {
    id: serial('id').primaryKey(),
    ip: text('ip').notNull(),
    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
    count: integer('count').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('rate_limit_ip_window_start_idx').on(table.ip, table.windowStart)],
);
