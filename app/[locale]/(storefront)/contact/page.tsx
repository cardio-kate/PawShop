import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { STOREFRONT_PAGE_CONTAINER_CLASSNAME } from '@/components/layout/page-styles';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Contact' });
  return { title: t('title'), description: t('intro') };
}

// docs/tz-pawshop.md §7.10: форма обратной связи не специфицирована ТЗ — здесь она чисто
// визуальная, без onSubmit/состояния, тем же приёмом, что и Button «Place Order» в
// CheckoutClient.tsx (Фаза 5 плана — реальный сабмит появится вместе с backend, вне текущей
// фазы). Кнопка — disabled (как «Place Order»), не просто без onClick: активная на вид кнопка
// без обработчика выглядела бы рабочей и не давала бы понять, что клик ничего не делает.
// Заголовок и колонка не центрированы, в отличие от Catalog/Delivery/Privacy Policy — см.
// design.md → Typography, «Исключение — Contact»: страница про заполнение формы, а не про чтение
// текста/таблицы, левое выравнивание h1 над левоориентированными полями формы держит единый
// вертикальный ритм блока. Токены — те же, что у остальных форм проекта (input-field/Textarea как
// в ProductForm.tsx/CheckoutClient.tsx, Button — тот же pill, что везде), без кастомных размеров.
export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Contact');

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

          <form className="mt-xl gap-md flex flex-col">
            <label className="gap-xs flex flex-col">
              <span className="text-label-md text-neutral-900">
                {t('form.name')} <span aria-hidden="true">*</span>
              </span>
              <Input name="name" autoComplete="name" required />
            </label>

            <label className="gap-xs flex flex-col">
              <span className="text-label-md text-neutral-900">
                {t('form.email')} <span aria-hidden="true">*</span>
              </span>
              <Input type="email" name="email" autoComplete="email" required />
            </label>

            <label className="gap-xs flex flex-col">
              <span className="text-label-md text-neutral-900">{t('form.phone')}</span>
              <Input type="tel" name="phone" autoComplete="tel" />
            </label>

            <label className="gap-xs flex flex-col">
              <span className="text-label-md text-neutral-900">{t('form.comment')}</span>
              <Textarea name="comment" rows={4} />
            </label>

            <Button disabled className="mt-sm self-start">
              {t('form.send')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
