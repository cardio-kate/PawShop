'use client';

import { useEffect, useState } from 'react';

// CLAUDE.md → «Заказ и корзина»: инпут поиска/цены каталога debounce ~300мс перед вызовом
// getProducts() — иначе каждая набранная буква/цифра бьёт по БД и дёргает сетку карточек.
// Debounce живёт здесь, на стороне компонента фильтров (CatalogClient) — сам getProducts ничего
// не знает о том, что вызов уже отложен.
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
