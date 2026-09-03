import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Inter, Fraunces } from 'next/font/google';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { pickMessages } from '@/i18n/pick-messages';
import '../globals.css';

// Header/LocaleSwitcher/error.tsx/CartDrawer-CartItem-CartSummary — единственные клиентские
// потребители next-intl вне конкретной страницы (см. i18n/pick-messages.ts), поэтому это
// единственные namespace в messages корневого провайдера. Catalog/Product/ProductPage/Checkout/
// Contact добавляются вложенным NextIntlClientProvider на своей странице, не сюда — иначе каждая
// страница снова тащила бы чужие namespace, тот же баг, который и решает pickMessages.
const GLOBAL_NAMESPACES = ['Header', 'Cart', 'ErrorBoundary'];

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
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${fraunces.variable}`}>
      <body className="bg-surface font-sans text-neutral-900 antialiased">
        <NextIntlClientProvider messages={pickMessages(messages, GLOBAL_NAMESPACES)}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
