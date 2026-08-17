'use client';

import { useState } from 'react';

// React-паттерн "adjust state when a value changes" (официальный, для React 19), вынесенный в
// общий хук: раньше Header.tsx (поиск открыт/закрыт + текст поля при смене ?search=) и
// CatalogClient.tsx (сброс пагинации при смене поиска/фильтров) независимо реализовывали одно и
// то же — сравнение с прошлым значением прямо во время рендера и setState внутри тела компонента,
// а не в useEffect. Разница с useEffect не косметическая: при изменении `value` реакт перезапускает
// рендер синхронно, до коммита в DOM — пользователь не видит кадр со старым производным состоянием
// (например, старую страницу пагинации поверх уже нового отфильтрованного списка), что случилось
// бы при сбросе через useEffect (лишний кадр между рендером и срабатыванием эффекта).
export function useSyncedValue<T>(value: T, onChange: (value: T) => void): void {
  const [synced, setSynced] = useState(value);
  if (!Object.is(value, synced)) {
    setSynced(value);
    onChange(value);
  }
}
