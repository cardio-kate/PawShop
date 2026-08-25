import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getDeliveryCountries } from '@/actions/delivery.actions';
import { STOREFRONT_PAGE_CONTAINER_CLASSNAME } from '@/components/layout/page-styles';
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
  const countries = await getDeliveryCountries();

  return (
    <div className={STOREFRONT_PAGE_CONTAINER_CLASSNAME}>
      <h1 className="text-h1 text-center text-neutral-900 uppercase">{t('title')}</h1>
      {/* bg-paw-tint/p-lg/rounded-2xl — тот же приём, что у demoNotice в Impressum (design.md →
          «Privacy Policy — публичная страница», тот же bg-paw-tint card, что AboutSection/
          Contact). pb-[20px] на обоих блоках страницы — по прямому запросу, не токен
          spacing-шкалы (ближайший — md/16px, меньше нужного), тот же приём, что у Impressum/
          Privacy Policy. */}
      <div className="bg-paw-tint p-lg mt-md rounded-2xl pb-[20px]">
        <p className="text-body-md text-neutral-700">{t('intro')}</p>
      </div>

      <div className="mt-xl overflow-x-auto pb-[20px]">
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
            {countries.map((country) => (
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
