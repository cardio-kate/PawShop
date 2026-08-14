import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'PrivacyPolicy' });
  return { title: t('title'), description: t('intro') };
}

// design.md → Components «Privacy Policy — публичная страница»: узкая колонка (max-w-reading,
// 680px), не на всю container-max — классическая длина строки для чтения сплошного текста.
export default async function PrivacyPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('PrivacyPolicy');

  const sections = ['whatWeCollect', 'whyWeCollect', 'retention', 'telegram', 'requests'] as const;

  return (
    <div className="mx-auto max-w-container px-lg pt-[60px]">
      <div className="mx-auto flex max-w-reading flex-col gap-lg">
        <div>
          <h1 className="text-center text-h1 uppercase text-neutral-900">{t('title')}</h1>
          <p className="mt-md text-body-md text-neutral-900">{t('intro')}</p>
        </div>

        {sections.map((section) => (
          <div key={section} className="flex flex-col gap-sm">
            <h2 className="text-h3 text-neutral-900">{t(`${section}.title`)}</h2>
            <p className="text-body-md text-neutral-900">{t(`${section}.body`)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
