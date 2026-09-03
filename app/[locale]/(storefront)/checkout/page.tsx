import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { CheckoutClient } from '@/components/checkout/CheckoutClient';
import { getDeliveryCountries } from '@/actions/delivery.actions';
import { STOREFRONT_PAGE_CONTAINER_CLASSNAME } from '@/components/layout/page-styles';
import { pickMessages } from '@/i18n/pick-messages';

// CheckoutClient — единственный клиентский потребитель next-intl на этой странице
// (useTranslations('Checkout')/('Cart')) — i18n/pick-messages.ts. Cart нужен здесь явно, даже
// хотя он уже есть в глобальном наборе root layout — вложенный provider подменяет контекст для
// своего поддерева целиком, не объединяет с родительским.
const PAGE_NAMESPACES = ['Checkout', 'Cart'];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Checkout' });
  return { title: t('title') };
}

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Checkout');
  const countries = await getDeliveryCountries();
  const messages = await getMessages();

  return (
    <div className={STOREFRONT_PAGE_CONTAINER_CLASSNAME}>
      <h1 className="text-h1 text-neutral-900">{t('title')}</h1>
      <div className="mt-xl">
        <NextIntlClientProvider messages={pickMessages(messages, PAGE_NAMESPACES)}>
          <CheckoutClient countries={countries} />
        </NextIntlClientProvider>
      </div>
    </div>
  );
}
