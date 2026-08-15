// Единый форматтер EUR для всей витрины (каталог, товар, корзина, checkout, delivery) — до этого
// один и тот же new Intl.NumberFormat(locale, {...}) был скопирован в 6 местах; правка формата
// (например, нюанс de/en из CLAUDE.md «Мультиязычность») требовала находить и синхронизировать
// все копии вручную.
export function formatPrice(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(value);
}
