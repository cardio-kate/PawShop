import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

// Ловит по-настоящему несовпавшие URL (опечатка в пути, битая ссылка) — в отличие от
// app/[locale]/(storefront)/not-found.tsx (ловит notFound() внутри витрины, с Header/Footer),
// этот файл рендерится Next.js в обход обычного дерева layout (node_modules/next/dist/docs/
// .../not-found.md, «global-not-found.js (experimental)») — у проекта два самостоятельных root
// layout (app/[locale]/layout.tsx и app/(admin)/layout.tsx), Next не может выбрать, какой из
// них использовать для несовпавшего URL, и не пытается: composить страницу нужно вручную,
// включая свой <html>/<body>, шрифт и globals.css. Локали (next-intl) на этом уровне ещё нет —
// URL не сматчился ни разу, поэтому текст намеренно на английском, не через t().
// Требует experimental.globalNotFound: true в next.config.ts.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'Page not found — PawShop',
  description: 'The page you are looking for does not exist.',
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-paw-tint flex min-h-screen items-center justify-center px-4 font-sans text-neutral-900 antialiased">
        <div className="gap-md flex flex-col items-center text-center">
          <h1 className="text-h1 uppercase">Page not found</h1>
          <p className="text-body-md text-neutral-500">
            The page you are looking for does not exist.
          </p>
          <Link href="/" className="text-label-md text-paw">
            Back to homepage
          </Link>
        </div>
      </body>
    </html>
  );
}
