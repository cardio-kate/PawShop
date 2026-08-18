'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// button-add-circle (каталог) и полнотекстовая Add to Cart (страница товара, design.md →
// «Add to Cart в сетке каталога») — семантически одно и то же действие, поэтому "added"-фидбек
// после клика длится одинаковое время в обоих местах через общий хук, а не подбирается заново
// под каждый компонент (тот же мотив дедупликации, что у useAnnouncement).
const ADDED_FEEDBACK_DURATION_MS = 1200;

export function useAddedFeedback(): [boolean, () => void] {
  const [added, setAdded] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trigger = useCallback(() => {
    setAdded(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setAdded(false), ADDED_FEEDBACK_DURATION_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return [added, trigger];
}
