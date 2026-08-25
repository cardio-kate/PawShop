// Единый форматтер EUR для всей витрины (каталог, товар, корзина, checkout, delivery) — до этого
// один и тот же new Intl.NumberFormat(locale, {...}) был скопирован в 6 местах; правка формата
// (например, нюанс de/en из CLAUDE.md «Мультиязычность») требовала находить и синхронизировать
// все копии вручную.
//
// value принимает string — Drizzle отдаёт numeric(10,2) как строку (CLAUDE.md → «Тесты»), а
// реальные DeliveryCountry.price/Product.price приходят из БД именно так; Number() здесь безопасен
// (только отображение, не арифметика — сложение денег по-прежнему обязано идти через lib/money.ts,
// не через этот Number()).
export function formatPrice(value: number | string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(
    typeof value === 'string' ? Number(value) : value,
  );
}
