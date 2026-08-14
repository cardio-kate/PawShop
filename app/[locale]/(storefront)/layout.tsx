import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

// Без revalidate витрина статически пререндерится один раз и захватит текущий год навсегда —
// Footer.tsx берёт copyright-год через new Date().getFullYear() на сервере, без опоры на
// клиентские данные. Раз в сутки достаточно: год меняется не чаще.
export const revalidate = 86400;

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<div className="h-20 border-b border-neutral-200 bg-surface" />}>
        <Header />
      </Suspense>
      <main>{children}</main>
      <Footer />
    </>
  );
}
