import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CheckoutClient } from '@/components/checkout/CheckoutClient';
import { getDeliveryCountries } from '@/actions/delivery.actions';
import { STOREFRONT_PAGE_CONTAINER_CLASSNAME } from '@/components/layout/page-styles';

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

  return (
    <div className={STOREFRONT_PAGE_CONTAINER_CLASSNAME}>
      <h1 className="text-h1 text-neutral-900">{t('title')}</h1>
      <div className="mt-xl">
        <CheckoutClient countries={countries} />
      </div>
    </div>
  );
}
