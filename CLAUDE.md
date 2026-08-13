@AGENTS.md

# PawShop — проектный контекст

Полные доки: [`docs/tz-pawshop.md`](docs/tz-pawshop.md) (ТЗ), [`docs/architecture.md`](docs/architecture.md)
(архитектура; раздел 9 — историческая справка про `proxy.ts`/рантайм в Next 16),
[`docs/design.md`](docs/design.md) (дизайн-система). Этот раздел — не
замена им, а выжимка решений, которые чаще всего ломают по незнанию или "улучшают" не спросив. При
конфликте между этим файлом и `docs/*` — доки главнее, значит этот файл устарел и его надо поправить, а не
молча следовать ему. Пути вроде `app/[locale]/(storefront)/**` ниже — целевая структура; на текущий момент
проект — скелет, часть этих путей ещё не создана (см. README и `.claude/plans/`) — не считать файл
существующим только потому, что путь упомянут здесь.

## Что за проект

Интернет-магазин зоотоваров для кошек, витрина на английском (основной) и немецком (второй — см.
«Мультиязычность» ниже), продажи в ЕС. Заказ оформляется как заявка без встроенной онлайн-оплаты; менеджер
(единственный админ) договаривается об оплате после связи с клиентом.

## Стек

Next.js 16 App Router (`proxy.ts`, не `middleware.ts` — см. `docs/architecture.md` §9, «Историческая
справка») · TypeScript
strict · Tailwind · Zustand + persist (корзина в localStorage) · Server Actions (без REST/GraphQL) ·
PostgreSQL на Neon · Drizzle ORM · Zod · собственный auth на bcryptjs + jose (без NextAuth/Clerk/Supabase)
· Vercel Blob · Telegram Bot API (только исходящие уведомления) · `next-intl` (или аналог) для EN/DE ·
деплой Vercel, но `output: 'standalone'` ради портируемости на VPS.

## Слои — соблюдать строго

`UI (components) → Actions (тонкие, /actions) → Services (бизнес-правила, lib/services) → Queries
(Drizzle, lib/db/queries) → Postgres`.

Каждый Server Action делает ровно: 1) проверка сессии (для админских — `requireAdminSession()`)
2) Zod-валидация входа 3) вызов соответствующей функции `services` 4) `revalidateTag`/`revalidatePath`
для затронутых страниц 5) типизированный ответ `{ success, data }` / `{ success: false, errors }`. SQL и
бизнес-условия в actions не пишутся — это обязанность `services`, иначе логика расползается и её нельзя
юнит-тестировать без поднятия Next.js. Исключение из шага 1 — публичные actions без сессии по конструкции
(`createOrder`, `requestPasswordReset`): вместо проверки сессии у них IP rate-limit, см. «Заказ и корзина».

`import 'server-only'` — первая строка в любом файле `lib/db/**`, `lib/auth.ts`, `lib/telegram.ts`,
`lib/storage/*.provider.ts`. Без этого секрет из такого модуля может тихо попасть в клиентский бандл при
случайном импорте в `'use client'`-компонент.

Ручной CSRF-токен городить не нужно — Server Actions в Next.js по умолчанию сверяют `Origin`/`Host` для
мутирующих запросов. Не отключать эту проверку явно в конфиге.

## Формы и валидация (react-hook-form + Zod)

Полная спецификация (aria-describedby, setError-паттерн, submit-состояния, zod v4) —
`docs/architecture.md` §3.11. `react-hook-form` + `@hookform/resolvers` (`zodResolver`) — стандартный
паттерн для любой формы в проекте. Сейчас это не зависимость — ставится в момент, когда пишется первая
реальная форма, не раньше (тот же принцип, что с `cloudinary.provider.ts` в разделе «Загрузка
изображений» — не заводить впрок).

- Одна Zod-схема из `lib/validation/*.schema.ts` на клиент и сервер — не заводить вторую, «облегчённую»
  под форму. Клиентская валидация — ускорение UX, не замена `safeParse` в action (шаг 2 из «Слои»):
  `zodResolver` обходится прямым вызовом action в обход формы.
- `lib/validation/*.schema.ts` **не** получает `import 'server-only'` — в отличие от `lib/db/**`/
  `lib/auth.ts`/`lib/telegram.ts`/`lib/storage/*.provider.ts` из «Слои», эти файлы обязаны
  импортироваться и в `'use client'`-компоненты (для `zodResolver`); секретов в схемах нет.
- `message` в схеме — ключ перевода (`'errors.email.invalid'`), не готовая строка на английском — см.
  «Мультиязычность» ниже.
- Zod в проекте — v4 (`package.json`), API кастомизации сообщений об ошибках отличается от v3 из
  обучающих данных — сверяться с `node_modules/zod` перед написанием схем, тот же класс расхождения,
  что с `proxy.ts`/Next 16 выше по файлу.

## Мультиязычность EN/DE (`docs/architecture.md` §3.10)

- Локализована только витрина (`app/[locale]/(storefront)/**`). Админка (`/admin/dashboard/**`) и
  `/staff-entry` живут без `[locale]` во втором корневом layout — route group `app/(admin)/**` не виден в
  URL, реальные сегменты пути — внутри него: `app/(admin)/admin/dashboard/**`,
  `app/(admin)/staff-entry`. Всегда на английском.
- `nameEn`/`descriptionEn` у `Product` обязательны; `nameDe`/`descriptionDe` — nullable. Резолюция fallback
  (`nameDe ?? nameEn`) — бизнес-правило в `products.service.ts`, не в `queries` и не в компоненте. `Category`
  — оба языка обязательны сразу (4 строки, заводятся сид-скриптом разработчиком, fallback не нужен).
- `slug` один на обе локали, не переводится — не заводить второй slug-столбец.
- Поиск (`getProducts({ search, locale })`) — `ILIKE` по имени **текущей** локали с fallback на английский
  для непереведённых, не по обеим колонкам сразу (иначе скоуп поиска молча расширится за пределы ТЗ §11).
- `proxy.ts` — один файл на locale-negotiation (вне `/admin`) и JWT-проверку (`/admin/dashboard/**`), не
  два файла.
- Telegram-уведомления и `DeliveryCountry.countryName` — не локализуются (см. architecture.md §3.10, «Что
  не локализуется»).
- Валюта одна — EUR на обеих локалях, конвертации нет (ТЗ §4 «Валюта», не меняется этим разделом; DE — тоже
  еврозона, менять и нечего). Разное — только формат числа: `12,90 €` (de) vs `€12.90` (en) через
  `Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' })` на отображении, значение в БД и
  `numeric(10,2)` не трогаются.
- Текст ошибок Zod-схем (`lib/validation/*.schema.ts`) переводится наравне с остальной витриной — не
  исключение из требования EAA. `message` в схеме — ключ (`'errors.email.invalid'`), не строка на
  английском; перевод — `useTranslations('errors')` (`next-intl` или выбранный аналог) в компоненте формы.
  Admin-формы и `/staff-entry` — ошибки на английском без ключей, как и весь остальной интерфейс админки
  (см. «Что не локализуется» выше).

## Осознанно НЕ реализуется (non-goals) — не «доделывать» по инициативе

- Онлайн-оплата, регистрация/личный кабинет обычных пользователей, несколько ролей/аккаунтов в админке
- Больше двух языков; локализация админ-панели и `/staff-entry` — они остаются на английском
- CRUD категорий из UI — 4 категории заводятся один раз `scripts/seed-categories.ts`, менять из
  админ-панели нельзя
- Создание/удаление стран доставки из UI — только `scripts/seed-delivery-countries.ts` +
  `updateDeliveryCountry` (правка `price`/`estimatedDays`/`isActive` у уже существующей страны)
- Idempotency key на повторную отправку заказа — риск дубля при гонке двух вкладок принят сознательно
- Входящий Telegram-webhook/эндпоинт для апдейтов от бота — интеграция строго односторонняя (`sendMessage`)
- Автоматизированное component/a11y-тестирование (React Testing Library, jest-axe) — `tests/unit`/
  `tests/integration` осознанно ограничены чистыми функциями и actions (см. «Тесты»); доступность
  компонентов проверяется вручную по чек-листу skill `a11y-review` на code review, не тестами. Если
  понадобится — отдельное решение с добавлением `jsdom`-окружения, не тихое расширение текущего
  `jest.config.js`.

Если задача выглядит как «а давай заодно добавим X» из этого списка — сначала спросить, не реализовывать
по умолчанию.

## Auth и сессии (`docs/architecture.md` §3.4, ТЗ §8)

- `proxy.ts` проверяет httpOnly JWT-cookie только для `/admin/dashboard/**`. `/staff-entry` — публичный
  маршрут верхнего уровня вне этой проверки, это осознанное решение, не дыра.
- Верификация JWT — только через `jose` (edge-safe, работает и в Node), используется и в `proxy.ts`, и в
  `requireAdminSession()`. `bcryptjs` — только в Server Actions/`services`, не в `proxy.ts` — это разделение
  ответственности, а не обход технического ограничения: в Next 16 Proxy по умолчанию Node.js-рантайм, а не
  Edge (см. `docs/architecture.md` §9, «Историческая справка»), так что `bcrypt` там технически заработает,
  но остаётся в `services` ради единообразия с остальной auth-логикой.
- `proxy.ts` — не единственная линия защиты: каждый админский action сам вызывает
  `requireAdminSession()` в начале тела, не полагаясь на то, что до него не долетит неавторизованный вызов.
- JWT payload несёт `Admin.sessionVersion`. `resetPassword` инкрементирует его в той же транзакции, где
  меняется `passwordHash` — иначе старые токены остаются валидны после сброса пароля.
- `failedLoginAttempts`/`lockedUntil` хранятся только в БД — serverless-инстанс не гарантирует
  переиспользование между запросами, счётчик в памяти процесса ничего не защитит.
- `resetToken` — `crypto.randomBytes(32).toString('hex')`, не короткий PIN; TTL 15 минут проверяется в
  `resetPassword`, а не только при выдаче. В БД хранится не сам токен, а его `sha256`-хэш
  (`Admin.resetTokenHash`) — по аналогии с паролем, чтобы утечка БД не давала готовый токен сброса
  (`docs/architecture.md` §3.4).
- Cookie-флаги: `httpOnly: true`, `sameSite: 'lax'`, `secure: process.env.NODE_ENV === 'production'` — не
  жёстко `secure: true`, иначе логин молча сломается на `localhost`.
- Первый и единственный админ — только через `scripts/create-admin.ts`; публичной регистрации нет.

## База данных (`docs/architecture.md` §4)

- Два клиента: `dbHttp` (`neon-http`, чтение) и `dbPool` (`neon-serverless` `Pool`, транзакции).
  `neon-http` **не поддерживает** `db.transaction()` — вставка `Order`+`OrderItem[]` и совместное
  обновление `failedLoginAttempts`/`lockedUntil` обязаны идти через `dbPool`.
- Денежные поля — `numeric(10,2)`, никогда `float`/`real`.
- Soft delete через `isActive` (`Product`, `ProductVariant`, `DeliveryCountry`) — не `DELETE`.
- FK `Order.deliveryCountryId`, `OrderItem.productId`/`variantId` — `onDelete: 'set null'` + `nullable`;
  история заказа держится в snapshot-полях (`priceAtOrder`, `productNameAtOrder`, `variantLabelAtOrder`,
  `shippingPriceAtOrder`) — не пересчитывать задним числом по текущим ценам/названиям.
- Цена товара в каталоге = `MIN(price)` активных вариантов — считать агрегатом в SQL, не забирать все
  варианты в JS и не гонять `Math.min` в цикле по каталогу.
- Деактивация последнего активного варианта товара запрещена на уровне `services` — иначе карточка
  останется видимой, но без цены. Полное снятие с продажи — `Product.isActive: false`.
- Товар без единой фотографии или без единого варианта сохранить нельзя — проверка в
  `products.service.ts`, не только в форме на клиенте.

## Заказ и корзина (ТЗ §7.5, §12)

- Корзина только на клиенте (Zustand + persist). При `createOrder` сервер пересчитывает сумму и берёт
  цены из БД — клиентским `total`/ценам не доверять никогда.
- Недоступные позиции (товар удалён/деактивирован после того, как лёг в корзину) исключаются на сервере с
  предупреждением, не блокируют весь заказ.
- `clearCart()` вызывается только после успешного ответа сервера, не оптимистично по клику.
- Индекс/телефон валидируются по формату конкретной страны (`deliveryCountryId`), не как «просто непустая
  строка».
- `createOrder` и `requestPasswordReset` — оба публичные неавторизованные мутирующие actions (сессии на
  момент вызова ещё нет), поэтому оба требуют IP rate-limit (`docs/architecture.md` §3.8).
  `requestPasswordReset` не защищён `failedLoginAttempts` — тот считает попытки `adminLogin`, а не запросы
  на генерацию `resetToken`; без лимита эндпоинт можно долбить, заспамив Telegram единственного админа.
  Реализация — таблица `rate_limit` в том же Postgres (`lib/rate-limit.ts`), НЕ `Map`/переменная процесса
  (не переживёт serverless между вызовами). Остальные админские actions — за `requireAdminSession()` —
  отдельного rate-limit не требуют.
- Поиск (`getProducts({ search })`) — `ILIKE` только по `Product.name`, без description/`flavor`/категории
  (сознательно узкий скоуп, ТЗ §11). Расширение скоупа — не «улучшение по умолчанию», а отдельное решение.
  Инпут поиска — debounce ~300мс перед вызовом (`useDebouncedValue`/аналог), не на каждый keystroke:
  и лишняя нагрузка на БД при вводе, и дёрганый UI из-за пересчёта каталога на каждую букву. Debounce —
  на клиенте, в компоненте поиска; сам `getProducts` ничего не знает о том, что вызов уже отложен.

## Загрузка изображений (`docs/architecture.md` §3.5)

Файл не идёт через тело Server Action целиком (лимит ~1MB). Поток: клиент запрашивает short-lived
upload-токен → грузит файл напрямую в Vercel Blob → на сервер уходит только URL.
`lib/storage/storage.interface.ts` абстрагирует провайдера; сейчас реализован только
`vercel-blob.provider.ts` (`cloudinary.provider.ts` — только если реально понадобится сменить
провайдера, не заранее). `next.config.ts` → `images.remotePatterns` должен указывать домен реально
используемого провайдера.

Отдельно — отображение (каталог, карточка товара, не относится к загрузке выше): `next/image` с
осознанным `priority`/`sizes`, не «как получится».
- `priority` — только для изображений в первом экране (первые 2–4 карточки каталога / hero на странице
  товара), не на всю сетку — иначе `priority` теряет смысл: браузер прелоадит всё разом, выигрыша нет.
- `sizes` — под фактическую раскладку сетки каталога (например,
  `(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw`), не оставлять Next.js дефолт — без явного
  `sizes` браузер может запросить более тяжёлый вариант картинки, чем нужно на мобильной колонке.
- Остальные карточки — `loading="lazy"` по умолчанию, это и есть поведение `next/image` без `priority`;
  включать вручную не нужно.

## Кэш и SEO (`docs/architecture.md` §3.1, ТЗ §1)

SSR/SSG выбран ради SEO — это не опция, а обязательство: страницы каталога и товара обязаны экспортировать
`generateMetadata` (title, description, canonical, `og:image` из `images[0]`); `app/sitemap.ts`/`robots.ts`
используют те же queries, что и страницы каталога. `getProducts`/`getProductBySlug` кэшируются тегом
`products`, `getDeliveryCountries` — тегом `delivery` (`unstable_cache`). Любой admin-action, меняющий эти
данные (`updateProduct`, `updateDeliveryCountry` и т.д.), обязан звать соответствующий
`revalidateTag` — иначе правки в админке не дойдут до публичной страницы до истечения TTL.
Next 16 параллельно вводит `"use cache"`/`cacheLife`/`cacheTag` («Cache Components», опционально через
`cacheComponents` в `next.config.ts`) как альтернативу `unstable_cache` — перед тем как писать кэш-слой,
свериться с `node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md`, а не
переносить `unstable_cache`-план из этого раздела вслепую (тот же класс расхождения, что с `proxy.ts`).

## Доступность (WCAG 2.1 AA / European Accessibility Act)

С 28.06.2025 EAA обязателен для e-commerce, продающего в ЕС — не «nice to have». Цветовой контраст уже
проверен в `docs/design.md` (`error`/`tertiary-on-tint`/`focus-ring`). Полный ручной чек-лист (labels/aria,
семантика, клавиатура/focus-visible, touch target, zoom 400%, `prefers-reduced-motion`) — skill
`a11y-review`, подключать при работе над любым новым интерактивным компонентом: `eslint-plugin-jsx-a11y`
(через `eslint-config-next`) проверяет только 6 синтаксических правил, поведенческие (labels, keyboard) —
не проверяет, чек-лист их не заменяет.

## Тесты

`tests/unit` — чистые функции `lib/services` (расчёт цены, пересчёт суммы заказа, блокировка логина), без
БД. `tests/integration` — actions с тестовой БД. Jest — единый раннер для обоих уровней.
Компонентные/a11y-тесты — вне этого объёма (см. «Осознанно НЕ реализуется»): `jest.config.js` использует
`testEnvironment: 'node'`, юнит-уровень — функции без DOM.
