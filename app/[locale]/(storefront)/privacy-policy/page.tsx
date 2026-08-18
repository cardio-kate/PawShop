import { getTranslations, setRequestLocale } from 'next-intl/server';
import { STOREFRONT_PAGE_CONTAINER_CLASSNAME } from '@/components/layout/page-styles';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'PrivacyPolicy' });
  return { title: t('title'), description: t('intro') };
}

// design.md → Components «Privacy Policy — публичная страница»: узкая колонка (max-w-reading,
// 680px), не на всю container-max — классическая длина строки для чтения сплошного текста.
export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('PrivacyPolicy');

  const sections = [
    'controller',
    'whatWeCollect',
    'whyWeCollect',
    'recipients',
    'transfers',
    'retention',
    'rights',
  ] as const;

  return (
    <div className={STOREFRONT_PAGE_CONTAINER_CLASSNAME}>
      <div className="max-w-reading gap-lg mx-auto flex flex-col">
        <div>
          <h1 className="text-h1 text-center text-neutral-900 uppercase">{t('title')}</h1>
          <p className="mt-md text-body-md text-neutral-900">{t('intro')}</p>
        </div>

        {/* pb-[20px] — по прямому запросу, не токен spacing-шкалы (ближайший — md/16px, меньше
            нужного). */}
        {sections.map((section) => (
          <div key={section} className="gap-sm flex flex-col pb-[20px]">
            <h2 className="text-h3 text-neutral-900">{t(`${section}.title`)}</h2>
            <p className="text-body-md text-neutral-900">{t(`${section}.body`)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
