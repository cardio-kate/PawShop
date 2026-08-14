import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// output: 'standalone' — задел на перенос с Vercel на VPS/Docker (docs/architecture.md, раздел 6)
// images.remotePatterns — без этого next/image откажется оптимизировать фото товаров,
// загруженные во внешнее хранилище (Vercel Blob), см. docs/architecture.md, раздел 3.5
const nextConfig: NextConfig = {
  output: 'standalone',
  // Индикатор статуса роута в dev-режиме (кружок в углу экрана) — мешает при визуальных
  // скриншотах/проверках; ошибки компиляции/рантайма он всё равно продолжает показывать.
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

export default withNextIntl(nextConfig);
