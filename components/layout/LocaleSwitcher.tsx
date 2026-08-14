'use client';

import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

// design.md не даёт отдельного компонента под переключатель локали — визуально следует тому же
// языку, что nav-link/focus-ring в Header (docs/design.md → Do's and Don'ts, focus-visible везде):
// тот же neutral-900 в покое, тот же hover:text-paw.
// -mx-sm px-sm -my-xs py-xs: без паддинга рендерится глиф ~16×18px — ниже минимума touch target
// 24×24px по WCAG 2.2 §2.5.8 (проверено getBoundingClientRect; px-xs давал 23.9px по ширине —
// недостаточно). Отрицательный margin гасит расширение padding-бокса для соседних элементов —
// визуальный интервал в «EN / DE» не меняется, растёт только кликабельная область. Один и тот же
// box-model — общий для активной и неактивной локали (LOCALE_BOX_CLASSNAME), иначе кликабельная
// DE отличается по размеру от статичной EN и выглядит асимметрично, хотя визуально не двигается.
const LOCALE_BOX_CLASSNAME = 'rounded-sm -mx-sm px-sm -my-xs py-xs';
const INACTIVE_LINK_CLASSNAME = `${LOCALE_BOX_CLASSNAME} text-neutral-900 transition-colors duration-fast hover:text-paw motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`;

export function LocaleSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations('Header');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLocale = useLocale();
  const query = Object.fromEntries(searchParams.entries());

  // role="group" обязателен: без role, поддерживающей вычисление имени, aria-label на голом div
  // скринридером игнорируется (проверено accessibility-снапшотом — EN/DE звучали без подписи
  // «Language» ни на десктопе, ни в мобильном бургер-меню).
  return (
    <div role="group" aria-label={t('language')} className="flex items-center gap-1 text-label-caps">
      {routing.locales.map((locale, index) => (
        <span key={locale} className="flex items-center gap-1">
          {index > 0 && (
            <span aria-hidden="true" className="text-neutral-300">
              /
            </span>
          )}
          {locale === currentLocale ? (
            <span aria-current="true" className={`${LOCALE_BOX_CLASSNAME} text-primary`}>
              {locale.toUpperCase()}
            </span>
          ) : (
            <Link href={{ pathname, query }} locale={locale} onClick={onNavigate} className={INACTIVE_LINK_CLASSNAME}>
              {locale.toUpperCase()}
            </Link>
          )}
        </span>
      ))}
    </div>
  );
}
