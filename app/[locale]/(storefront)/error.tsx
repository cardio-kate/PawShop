'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { STOREFRONT_PAGE_CONTAINER_CLASSNAME } from '@/components/layout/page-styles';

// Error boundary обязан быть Client Component (node_modules/next/dist/docs/.../error.md) —
// useTranslations (клиентский хук next-intl), не getTranslations. Не оборачивает
// app/[locale]/(storefront)/layout.tsx (тот в том же сегменте — граница error.js не покрывает
// layout.js в своей же папке, node_modules/next/dist/docs/.../error.md, «does NOT wrap the
// layout.js... above it in the same segment»): значит Header/Footer остаются смонтированы и
// рабочими, даже когда упал сам контент страницы — это и есть цель, не побочный эффект.
// retry, не reset — проп переименован и стал стабильным в Next 16.3.0 (см. Version History
// того же файла доки), reset из старых доков/обучающих данных здесь не актуален.
export default function StorefrontError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations('ErrorBoundary');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={STOREFRONT_PAGE_CONTAINER_CLASSNAME}>
      <div className="gap-md py-3xl flex flex-col items-center text-center">
        <h1 className="text-h1 text-neutral-900 uppercase">{t('title')}</h1>
        <p className="text-body-md text-neutral-700">{t('description')}</p>
        <Button variant="primary" onClick={() => retry()}>
          {t('retry')}
        </Button>
      </div>
    </div>
  );
}
