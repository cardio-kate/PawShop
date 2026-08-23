---
name: security-review
description: Use this skill when touching auth (proxy.ts, lib/auth.ts, auth.service.ts, auth.actions.ts), adding/editing a Server Action, working with lib/db, lib/storage, lib/telegram.ts, or lib/rate-limit.ts, or changing .env / next.config.ts. Provides a security checklist scoped to PawShop's actual stack and architecture (docs/architecture.md).
metadata:
  origin: pawshop
---

# Security Review — PawShop

Чек-лист под реальный стек проекта: Next.js 16 (App Router, `proxy.ts` вместо `middleware.ts`) ·
Drizzle ORM + Neon Postgres · Zod · собственная auth (bcryptjs + jose) · Vercel Blob · Telegram Bot API.
Онлайн-оплаты и публичной регистрации в проекте нет — заказ оформляется как заявка, админ один.
Не добавляй проверки под то, чего в проекте нет (Supabase RLS, кошельки/Solana, Express,
GraphQL, платежи) — это перечислено в конце как то, что сознательно не применяется.

## Когда активировать

- Правки в `proxy.ts`, `lib/auth.ts`, `auth.service.ts`, `auth.actions.ts`, `components/auth/**`
- Новый или изменённый Server Action в `/actions` (особенно принимающий данные от неавторизованного пользователя — `createOrder`)
- Правки в `lib/db/**` (schema, queries) — доступ к БД
- Правки в `lib/storage/**` (загрузка изображений) или `lib/rate-limit.ts`
- Правки в `lib/telegram.ts` (что уходит наружу в уведомление)
- Изменения `.env.example`, `next.config.ts`, `drizzle.config.ts`
- Перед любым деплоем на прод

## 1. Секреты

Секреты проекта: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `JWT_SECRET`, `TELEGRAM_BOT_TOKEN`,
`BLOB_READ_WRITE_TOKEN`. Все живут в `.env` (не в `.env.example`, не в коде).

```typescript
// PASS
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error('JWT_SECRET not configured');

// FAIL — секрет прямо в коде
const jwtSecret = 'a1b2c3...';
```

- [ ] `import 'server-only'` — первая строка в каждом файле `lib/db/**`, `lib/auth.ts`,
      `lib/telegram.ts`, `lib/storage/*.provider.ts`. Это единственная защита от случайного импорта
      такого модуля в `'use client'`-компонент, из-за которого `DATABASE_URL`/`JWT_SECRET`/токен бота
      тихо утекут в клиентский бандл (docs/architecture.md, раздел 2).
- [ ] Ни один секрет не попадает в `console.log`/сообщение об ошибке, которое видит клиент
- [ ] `.env` в `.gitignore` (проверено — да), в git-истории секретов нет
- [ ] Прод-секреты — в Vercel env vars, не в репозитории

## 2. Валидация входных данных (Zod)

Схемы в `lib/validation/*.schema.ts` — общие для клиента и сервера. Любой Server Action,
принимающий данные (особенно неавторизованный, как `createOrder`), валидирует их этой схемой
**на сервере**, до похода в `services`/`queries` — клиентская валидация не считается защитой.

```typescript
// actions/orders.actions.ts
export async function createOrder(input: unknown) {
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues };
  }
  return orderService.createOrder(parsed.data);
}
```

- [ ] **Сумма заказа пересчитывается на сервере из актуальных цен в БД, а не берётся из корзины
      клиента.** Это явное требование архитектуры (`orders.service.ts` — «пересчёт суммы,
      проверка актуальности корзины», раздел 3.1/3.8 architecture.md) — доверять `total` из
      клиентского запроса нельзя.
- [ ] Загрузка изображений в `ImageUploader`/`vercel-blob.provider.ts` проверяет размер, MIME-тип
      и расширение до отправки в Vercel Blob (эта функциональность доступна только админу за
      `requireAdminSession()`, но входной файл всё равно недоверенный)
- [ ] Ошибки валидации не палят внутреннюю структуру (детали Zod-ошибки — ок для 4xx-ответа
      формы, стек-трейс/детали БД — нет)

## 3. Доступ к БД (Drizzle)

Все запросы — через Drizzle (`lib/db/queries/**`), без ручной конкатенации SQL.

```typescript
// PASS
await db.select().from(products).where(eq(products.slug, slug));

// FAIL — конкатенация, даже через Drizzle sql``
await db.execute(sql.raw(`SELECT * FROM products WHERE slug = '${slug}'`));
```

- [ ] Нет строковой конкатенации значений пользователя в SQL; если нужен raw SQL — только
      параметризованный `sql\`...${value}...\``, никогда `sql.raw` с пользовательским вводом
- [ ] `dbPool` (транзакции) используется там, где несколько связанных записей должны быть
      атомарны — вставка `Order`+`OrderItem[]`, обновление `failedLoginAttempts`/`lockedUntil`
      (раздел 3.6/3.4 architecture.md) — не два отдельных запроса, между которыми возможна гонка

## 4. Авторизация администратора (JWT + bcrypt)

Схема сессии зафиксирована в architecture.md §3.4 — при любых правках `proxy.ts`/`lib/auth.ts`
сверяйся с ней, а не изобретай заново.

- [ ] `proxy.ts` проверяет httpOnly JWT-cookie только для `/nine-lives/dashboard/**`. `/staff-entry`
      (страница логина) остаётся вне этой проверки — так и должно быть, это не дыра
- [ ] Верификация JWT в `proxy.ts` — только через `jose` (Node runtime по умолчанию с Next 16,
      но `jose` остаётся безопасным выбором и там, и в Edge). `bcryptjs`/сравнение пароля —
      только в Server Actions/`services`, никогда в `proxy.ts`
- [ ] Cookie-флаги сессии: `httpOnly: true`, `sameSite: 'lax'`,
      `secure: process.env.NODE_ENV === 'production'` — не `secure: true` жёстко (иначе логин
      сломается на `localhost`), не `sameSite: 'none'`
- [ ] Токен в payload несёт `Admin.sessionVersion`; `verifySession` сверяет его со значением в
      БД. `resetPassword` инкрементирует `sessionVersion` в той же транзакции, где меняется
      `passwordHash` — иначе старые токены остаются валидны после сброса пароля
- [ ] `failedLoginAttempts`/`lockedUntil` читаются и пишутся **в БД**, не в переменной процесса —
      в serverless-инстансе счётчик в памяти не переживает между запросами и ничего не защищает
- [ ] `resetToken` — `crypto.randomBytes(32).toString('hex')`, не короткий PIN; TTL 15 минут
      проверяется в `resetPassword`, а не только при выдаче
- [ ] В БД (`Admin.resetTokenHash`) хранится `sha256`-хэш токена, не сырой токен — по аналогии с
      `passwordHash`. Сырой токен уходит только в Telegram-сообщение; утечка БД не должна давать
      готовый рабочий токен сброса пароля
- [ ] Ответ `adminLogin` не даёт понять, что именно неверно — логин или пароль (единое сообщение)
- [ ] Никакой публичной регистрации/эндпоинта создания админа — только `scripts/create-admin.ts`

## 5. CSRF

Ручной CSRF-токен здесь не нужен — Next.js Server Actions по умолчанию сверяют `Origin`/`Host`
для мутирующих запросов (architecture.md, раздел 3.3). Проверка на review:

- [ ] Эта проверка нигде явно не отключена (нет кастомного обхода в `next.config.ts`/actions)
- [ ] Мутации (`createOrder`, `adminLogin`, `updateProduct` и т.д.) всё ещё идут через Server
      Actions, а не через самодельный `fetch` на публичный `route.ts` без этой защиты

## 6. Rate limiting

`createOrder` — единственный публичный неавторизованный мутирующий action, поэтому именно он
нуждается в лимите по IP; админские actions уже закрыты `requireAdminSession()` +
`failedLoginAttempts`/`lockedUntil` и второй слой лимитов им не нужен (architecture.md §3.8).

- [ ] `lib/rate-limit.ts` считает попытки в Postgres-таблице `rate_limit` по `x-forwarded-for`,
      не в `Map`/переменной процесса (то же ограничение serverless, что и для логина)
- [ ] Старые записи чистятся (`DELETE ... WHERE createdAt < now() - interval`), иначе таблица
      растёт без предела на каждую попытку оформления заказа
- [ ] Не полагаться только на клиентскую блокировку кнопки «Place Order» — она защищает от
      случайного дабл-клика, не от прямого вызова action в обход UI

## 7. Утечка данных / логирование

Платёжных данных в проекте нет (заказ — заявка без встроенной онлайн-оплаты), но в `Order` есть
PII клиента: `customerName`, `phone`, `street`/`city`/`postalCode`, `comment` (email в модели `Order`
нет — не путать с `Admin.username`, который тоже не email).

```typescript
// FAIL
console.error('createOrder failed', order); // весь объект с PII в логах

// PASS
console.error('createOrder failed', { orderId: order.id });
```

- [ ] PII заказа (имя/адрес/телефон/comment) не уходит в `console.log`/логи целиком
- [ ] Ошибка, которую видит клиент формы — общее сообщение; детали (включая ошибки Drizzle/Neon)
      только в серверный лог
- [ ] Sharp/обработка изображений и Telegram-уведомления обёрнуты в `try/catch`; падение
      Telegram не блокирует и не откатывает уже сохранённый заказ (это осознанное решение
      проекта, не баг — не «чинить», добавляя ретраи/очередь)
- [ ] Если `lib/telegram.ts` использует `parse_mode: 'MarkdownV2'`, пользовательские поля
      (`customerName`, `street`, `city`, `comment`) экранированы перед подстановкой в текст —
      иначе Telegram Bot API молча отклоняет **всё** сообщение при обычных символах вроде `.`/`-`/`(`
      в адресе, а `try/catch` выше это проглатывает без следа (docs/architecture.md §3.6). Проще и
      надёжнее — не использовать `parse_mode` для полей со свободным вводом клиента вообще.

## 8. Зависимости

- [ ] `npm audit` чист (или riски осознанно приняты)
- [ ] `package-lock.json` закоммичен, `npm ci` в CI/деплое, а не `npm install`

## Перед деплоем на прод

- [ ] Секреты — только в Vercel env vars
- [ ] Все входные данные Server Actions валидируются Zod-схемой на сервере
- [ ] Сумма заказа пересчитывается на сервере, не берётся из клиента
- [ ] Cookie-флаги сессии верные для прод (`secure: true` реально применится в `NODE_ENV=production`)
- [ ] `sessionVersion` инвалидирует сессии после сброса пароля
- [ ] Rate limit на `createOrder` включён и таблица `rate_limit` чистится
- [ ] `next.config.ts` → `images.remotePatterns` не расширен на произвольные домены сверх
      Vercel Blob
- [ ] Нет PII/секретов в логах

## Сознательно не входит в этот чек-лист

Это не «забыто», а вычеркнуто под конкретный стек проекта — не добавляй эти пункты обратно:

- **Row Level Security / Supabase** — в проекте не Supabase, а Neon + Drizzle; авторизация на
  уровне запросов делается явными проверками в `services`/`requireAdminSession()`, не RLS-политиками
- **Проверка подписи кошелька / блокчейн-транзакций** — в проекте нет крипто/Solana
- **Express `rate-limit` middleware** — в проекте нет Express; лимит на `createOrder` — свой,
  на таблице Postgres (см. п.6)
- **Ролевая модель (`role !== 'admin'`)** — в проекте один администратор, не мультиролевая
  система; достаточно `requireAdminSession()`
- **Безопасность платежей / номеров карт** — заказ оформляется как заявка без встроенной
  онлайн-оплаты (README)
- **DOMPurify / рендер произвольного HTML** — в проекте нет rich text/markdown-полей;
  весь контент рендерится через обычный JSX (авто-экранирование React). Если это изменится —
  вернуть пункт про санитайзинг перед использованием `dangerouslySetInnerHTML`
