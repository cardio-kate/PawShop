// Пороги проекта, которые иначе разбредутся магическими числами по services (CLAUDE.md → «Auth и
// сессии», «Заказ и корзина»). Не 'server-only' — часть значений (CATALOG_PAGE_SIZE,
// PRODUCT_MIN_ITEMS) могут понадобиться и клиентским компонентам, секретов здесь нет.

// ТЗ §12: «например, 15 минут после 5 попыток» — конкретные числа из примера ТЗ, не выдуманы отдельно.
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MINUTES = 15;

// ТЗ §8/§7.7: код восстановления действителен 15 минут.
export const RESET_TOKEN_TTL_MINUTES = 15;

// docs/architecture.md §3.8: «окно в несколько минут» — конкретный порог не зафиксирован в ТЗ/доках,
// выбран как разумный дефолт (не бизнес-решение, а технический анти-спам порог, безопасно менять
// позже без миграции данных): не более 5 попыток createOrder/requestPasswordReset с одного IP за 10 минут.
export const RATE_LIMIT_WINDOW_MINUTES = 10;
export const RATE_LIMIT_MAX_REQUESTS = 5;

// docs/architecture.md §4 «Пагинация каталога»: 2 ряда по 4 колонки на десктопе.
export const CATALOG_PAGE_SIZE = 8;

// ТЗ §10 / docs/architecture.md §4: товар обязан иметь минимум одно фото и один вариант. То же
// значение, что уже захардкожено на клиенте в components/admin/constants.ts → PRODUCT_MIN_ITEMS —
// если минимум когда-нибудь изменится, обе константы правятся вместе, не по отдельности.
export const PRODUCT_MIN_ITEMS = 1;
