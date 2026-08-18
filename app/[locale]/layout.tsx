import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Inter, Fraunces } from 'next/font/google';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import '../globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'PawShop — cat food and accessories',
    template: '%s — PawShop',
  },
  description: 'PawShop — online store for cat food and accessories, shipping across the EU.',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${inter.variable} ${fraunces.variable}`}>
      <body className="bg-surface font-sans text-neutral-900 antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
