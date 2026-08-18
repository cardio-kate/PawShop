'use client';

import { useState } from 'react';

// a11y-review checklist п.6 «Динамический контент»: общий хук для одноразовых aria-live
// объявлений (клик по «Add to cart» без видимого фидбека, кроме счётчика в Header, который
// скринридер не озвучивает) — раньше AddToCartButton.tsx и ProductDetailClient.tsx независимо
// заводили один и тот же useState('') под эту роль. Рендер самого региона — components/ui/LiveRegion.tsx.
export function useAnnouncement(): [string, (message: string) => void] {
  const [message, setMessage] = useState('');
  return [message, setMessage];
}
