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
  // Без этого dev-сервер молча режет 403-м все _next/* чанки при заходе с телефона по LAN IP
  // (проверка cross-origin в dev, node_modules/next/dist/docs/.../allowedDevOrigins.md) — HTML
  // рендерится, но React не гидрируется, и вся страница выглядит нерабочей/некликабельной.
  // DEV_LAN_IP — личный IP разработчика (.env.local, не коммитится, см. .env.example): у каждого
  // свой, и он меняется при переподключении к Wi-Fi — хардкодить конкретное значение сюда нельзя,
  // иначе на чужой машине эта запись просто бесполезна, а после смены IP на этой же — снова 403.
  allowedDevOrigins: process.env.DEV_LAN_IP ? [process.env.DEV_LAN_IP] : [],
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
