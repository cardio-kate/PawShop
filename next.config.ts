import type { NextConfig } from 'next';

// output: 'standalone' — задел на перенос с Vercel на VPS/Docker (docs/architecture.md, раздел 6)
// images.remotePatterns — без этого next/image откажется оптимизировать фото товаров,
// загруженные во внешнее хранилище (Vercel Blob), см. docs/architecture.md, раздел 3.5
const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
};

export default nextConfig;
