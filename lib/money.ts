// Арифметика над numeric(10,2)-строками (Drizzle отдаёт numeric как string, не number — CLAUDE.md
// → «Тесты»). Никаких parseFloat/toFixed: все значения переводятся в целые центы через строковый
// разбор (без плавающей точки на любом шаге), считаются как целые числа, переводятся обратно.

function toCents(value: string): number {
  const trimmed = value.trim();
  const negative = trimmed.startsWith('-');
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [wholePart = '', fractionPart = ''] = unsigned.split('.');
  if (!/^\d+$/.test(wholePart) || !/^\d{0,2}$/.test(fractionPart)) {
    throw new Error(`lib/money.ts: invalid numeric(10,2) value "${value}"`);
  }
  const cents = Number.parseInt(`${wholePart}${fractionPart.padEnd(2, '0').slice(0, 2)}`, 10);
  return negative ? -cents : cents;
}

function fromCents(cents: number): string {
  const negative = cents < 0;
  const absCents = Math.abs(cents);
  const wholePart = Math.floor(absCents / 100);
  const fractionPart = String(absCents % 100).padStart(2, '0');
  return `${negative ? '-' : ''}${wholePart}.${fractionPart}`;
}

export function add(a: string, b: string): string {
  return fromCents(toCents(a) + toCents(b));
}

export function multiplyByQuantity(price: string, quantity: number): string {
  return fromCents(toCents(price) * quantity);
}

export function sum(values: string[]): string {
  return fromCents(values.reduce((total, value) => total + toCents(value), 0));
}
