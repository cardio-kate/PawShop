import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MOCK_DELIVERY_COUNTRIES } from '@/components/product/mock-data';
import { formatPrice } from '@/lib/utils';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Delivery' });
  return { title: t('title'), description: t('intro') };
}

// design.md → Components «Delivery — публичная страница»: тёплый стиль витрины, не admin-таблица —
// без table-row-even/odd и рамок table-border, только тонкая линия neutral-200 между строками.
export default async function DeliveryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Delivery');

  return (
    <div className="mx-auto max-w-container px-lg pt-[60px]">
      <h1 className="text-center text-h1 uppercase text-neutral-900">{t('title')}</h1>
      <p className="mt-md max-w-reading text-body-md text-neutral-700">{t('intro')}</p>

      <div className="mt-xl overflow-x-auto">
        <table className="w-full min-w-[480px] text-left">
          <thead>
            <tr className="border-b border-neutral-200">
              <th scope="col" className="py-sm pr-md text-label-md text-neutral-900">
                {t('table.country')}
              </th>
              <th scope="col" className="py-sm pr-md text-label-md text-neutral-900">
                {t('table.price')}
              </th>
              <th scope="col" className="py-sm text-label-md text-neutral-900">
                {t('table.estimatedDays')}
              </th>
            </tr>
          </thead>
          <tbody>
            {MOCK_DELIVERY_COUNTRIES.map((country) => (
              <tr key={country.id} className="border-b border-neutral-200">
                <td className="py-sm pr-md text-body-md text-neutral-900">{country.countryName}</td>
                <td className="py-sm pr-md text-body-md text-neutral-900">
                  {formatPrice(country.price, locale)}
                </td>
                <td className="py-sm text-body-md text-neutral-700">
                  {t('daysValue', { days: country.estimatedDays })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
