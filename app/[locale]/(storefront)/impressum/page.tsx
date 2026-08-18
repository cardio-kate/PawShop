import { getTranslations, setRequestLocale } from 'next-intl/server';
import { STOREFRONT_PAGE_CONTAINER_CLASSNAME } from '@/components/layout/page-styles';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Impressum' });
  return { title: t('title'), description: t('intro') };
}

// Тот же shell, что у Privacy Policy (design.md → «Privacy Policy — публичная страница»): узкая
// колонка max-w-reading, sections.map по title/body. demoNotice — отдельный bg-paw-tint card
// (тот же приём, что AboutSection/Contact), не внутри sections.map: это не юридический контент
// страницы, а метка поверх него, поэтому визуально и структурно вынесена отдельно, перед
// формальным текстом — см. договорённость по /widerruf (page-specific note до основного текста).
export default async function ImpressumPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Impressum');

  const sections = [
    'provider',
    'contact',
    'register',
    'disputeResolution',
    'responsibility',
  ] as const;

  return (
    <div className={STOREFRONT_PAGE_CONTAINER_CLASSNAME}>
      <div className="max-w-reading gap-lg mx-auto flex flex-col">
        <div>
          <h1 className="text-h1 text-center text-neutral-900 uppercase">{t('title')}</h1>
          <p className="mt-md text-body-md text-neutral-900">{t('intro')}</p>
        </div>

        <div className="bg-paw-tint p-lg rounded-2xl">
          <p className="text-body-sm text-neutral-700">{t('demoNotice')}</p>
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
