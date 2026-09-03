import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { ContactClient } from '@/components/contact/ContactClient';
import { STOREFRONT_PAGE_CONTAINER_CLASSNAME } from '@/components/layout/page-styles';
import { pickMessages } from '@/i18n/pick-messages';

// ContactClient — единственный клиентский потребитель next-intl на этой странице
// (useTranslations('Contact')) — i18n/pick-messages.ts.
const PAGE_NAMESPACES = ['Contact'];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Contact' });
  return { title: t('title'), description: t('intro') };
}

// Фаза 7 плана (docs/product-spec.md §7.10, .claude/plans/backend-realization-pawshop.md): форма
// подключена к submitContactMessage через ContactClient — реальный сабмит, не декоративная
// disabled-кнопка. Заголовок и колонка не центрированы, в отличие от Catalog/Delivery/Privacy
// Policy — см. design.md → Typography, «Исключение — Contact»: страница про заполнение формы, а не
// про чтение текста/таблицы, левое выравнивание h1 над левоориентированными полями формы держит
// единый вертикальный ритм блока.
export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Contact');
  const messages = await getMessages();

  return (
    <div className={STOREFRONT_PAGE_CONTAINER_CLASSNAME}>
      {/* Тот же приём, что у About на главной (bg-paw-tint card) — верхние 40px до блока остаются
          белым отступом страницы (как у About: pt-[40px] в page.tsx до самой bg-paw-tint секции),
          серый начинается только с самого блока, не сразу под хедером. Скругление только сверху
          (rounded-t-2xl, как у ValuePropsSection), а не со всех сторон. pb-[20px] (было pb-[5px],
          вплотную к кнопке Send) — по прямому запросу, тот же приём, что у секций Impressum/
          Privacy Policy/Delivery. */}
      <div className="bg-paw-tint p-xl rounded-t-2xl pb-[20px]">
        <div className="max-w-reading">
          <h1 className="text-h1 text-neutral-900 uppercase">{t('title')}</h1>
          <p className="mt-md text-body-md text-neutral-700">{t('intro')}</p>

          <NextIntlClientProvider messages={pickMessages(messages, PAGE_NAMESPACES)}>
            <ContactClient />
          </NextIntlClientProvider>
        </div>
      </div>
    </div>
  );
}
