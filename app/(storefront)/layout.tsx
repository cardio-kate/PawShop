import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<div className="h-20 border-b border-neutral-200 bg-surface" />}>
        <Header />
      </Suspense>
      <main>{children}</main>
    </>
  );
}
