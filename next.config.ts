import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const isProd = process.env.NODE_ENV === 'production';

// Без nonce — проще и безопаснее точечно добавить, чем вплетать nonce-генерацию в
// next-intl-middleware внутри proxy.ts (тот уже занят locale-negotiation; совмещать две логики
// в одном middleware — отдельный, более рискованный заход, не часть этой правки). script-src
// 'unsafe-inline' — не ослабление по незнанию: App Router сам инжектит инлайн-скрипты для
// RSC-гидратации (`self.__next_f.push(...)`, видно в HTML любой страницы) — без nonce или
// unsafe-inline CSP блокирует их и рвёт гидратацию целиком, приложение становится нерабочим,
// не просто менее защищённым. Апгрейд до nonce-based CSP (node_modules/next/dist/docs/01-app/
// 02-guides/content-security-policy.md) — оправдан отдельным заходом позже: витрина и так уже
// SSR, не SSG (CLAUDE.md → «Кэш и SEO», известный gap с next-intl/Cache Components), так что
// доп. cost от вынужденного динамического рендеринga под nonce не добавляется, но сама интеграция
// с next-intl-middleware — не тривиальная правка на fly.
// img-src — тот же Vercel Blob домен, что в images.remotePatterns ниже, иначе фото товаров,
// загруженные туда, молча заблокируются CSP на проде, хотя next/image их спокойно отдаёт.
// connect-src — ImageUploader.tsx грузит файл напрямую с клиента через put() из '@vercel/blob/
// client' (architecture.md §3.5), а не через Server Action; без этих двух хостов в connect-src
// сам fetch падает по CSP ещё до сети (не ошибка Blob, ошибка браузера) — vercel.com/api/blob
// это координационный вызов put() (выдача presigned-параметров, node_modules/@vercel/blob/dist/
// chunk-YYMLUMXS.js: defaultVercelBlobApiUrl), а сам файл после этого летит на
// {storeId}.public.blob.vercel-storage.com — тот же домен, что уже в img-src выше.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://*.public.blob.vercel-storage.com;
  font-src 'self';
  connect-src 'self' https://vercel.com https://*.public.blob.vercel-storage.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, ' ')
  .trim();

// output: 'standalone' — задел на перенос с Vercel на VPS/Docker (docs/architecture.md, раздел 6)
// images.remotePatterns — без этого next/image откажется оптимизировать фото товаров,
// загруженные во внешнее хранилище (Vercel Blob), см. docs/architecture.md, раздел 3.5
const nextConfig: NextConfig = {
  output: 'standalone',
  // jose (lib/auth.ts) — чистый ESM без CJS-сборки (node_modules/jose/package.json) — без этого и
  // бандлер next build, и next/jest (читает ту же опцию) спотыкаются об `export` внутри node_modules.
  // next-intl — та же причина: products.actions.ts (через i18n/routing.ts) импортирует его, и первый
  // integration-тест, реально дошедший до этого импорта, падал с "Unexpected token 'export'" — next/jest
  // строит transformIgnorePatterns из этого списка (node_modules/next/dist/build/jest/jest.js), это
  // единственный официальный рычаг, не переопределение готового массива в самом jest-конфиге.
  transpilePackages: ['jose', 'next-intl'],
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
  // Два самостоятельных root layout (app/[locale]/layout.tsx, app/(admin)/layout.tsx) — без
  // этого флага Next не может собрать 404 для URL, не совпавшего вообще ни с одним роутом
  // (нет общего layout, который можно было бы использовать), и отдаёт голый <html id="__next_error__">
  // без lang и без стилей. См. app/global-not-found.tsx.
  experimental: {
    globalNotFound: true,
  },
  // HSTS — только на проде (isProd), не жёстко всегда: та же дисциплина, что у cookie-флага
  // secure в lib/auth.ts (CLAUDE.md → «Auth и сессии») — на localhost (http) браузеры по спеке
  // обязаны игнорировать Strict-Transport-Security, но не все реализации одинаково строги,
  // рисковать локальной разработкой ради заголовка, который на проде можно включить безусловно
  // отдельной строкой, незачем. X-Frame-Options — формально заменён frame-ancestors в CSP выше
  // (шире поддержка в современных браузерах), но старые User-Agent его не читают — держим оба,
  // это не конфликт, а расширенное покрытие.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: cspHeader },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          ...(isProd
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains; preload',
                },
              ]
            : []),
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

export default withNextIntl(nextConfig);
