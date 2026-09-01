import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { STOREFRONT_PAGE_CONTAINER_CLASSNAME } from '@/components/layout/page-styles';

// Ловит notFound() из сегментов внутри (storefront) (например несуществующий slug товара) —
// рендерится внутри app/[locale]/layout.tsx, поэтому получает html lang, NextIntlClientProvider
// и Header/Footer этого layout (app/[locale]/(storefront)/layout.tsx), в отличие от дефолтного
// Next.js not-found (см. app/global-not-found.tsx — тот ловит по-настоящему несовпавшие URL, где
// такого layout-контекста ещё нет). Текстовый паттерн — тот же, что у пустой корзины
// (CheckoutClient.tsx): центрированный текст + текстовая ссылка-паучок, без отдельной кнопки.
export async function generateMetadata() {
  const t = await getTranslations('NotFound');
  return { title: t('title'), description: t('description') };
}

export default async function StorefrontNotFound() {
  const t = await getTranslations('NotFound');

  return (
    <div className={STOREFRONT_PAGE_CONTAINER_CLASSNAME}>
      {/* py-3xl — на вложенном div, не на STOREFRONT_PAGE_CONTAINER_CLASSNAME: тот уже задаёт
          pt-[40px]/pb-[40px], совмещать с py-3xl на одном элементе — та же ловушка порядка
          Tailwind-классов, что у Badge.tsx/Chip.tsx. Паттерн — как у пустой корзины
          (CheckoutClient.tsx) и пустого каталога (CatalogClient.tsx). */}
      <div className="gap-md py-3xl flex flex-col items-center text-center">
        <h1 className="text-h1 text-neutral-900 uppercase">{t('title')}</h1>
        <p className="text-body-md text-neutral-700">{t('description')}</p>
        <Link href="/" className="text-label-md text-paw">
          {t('backHome')}
        </Link>
      </div>
    </div>
  );
}
