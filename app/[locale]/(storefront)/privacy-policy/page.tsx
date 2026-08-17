import { getTranslations, setRequestLocale } from 'next-intl/server';

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

  const sections = ['whatWeCollect', 'whyWeCollect', 'retention', 'telegram', 'requests'] as const;

  return (
    <div className="max-w-container px-lg mx-auto pt-[60px]">
      <div className="max-w-reading gap-lg mx-auto flex flex-col">
        <div>
          <h1 className="text-h1 text-center text-neutral-900 uppercase">{t('title')}</h1>
          <p className="mt-md text-body-md text-neutral-900">{t('intro')}</p>
        </div>

        {sections.map((section) => (
          <div key={section} className="gap-sm flex flex-col">
            <h2 className="text-h3 text-neutral-900">{t(`${section}.title`)}</h2>
            <p className="text-body-md text-neutral-900">{t(`${section}.body`)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
