import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { FOCUS_RING_CLASSNAME } from '@/components/ui/interaction-styles';

const FOOTER_LINKS = [
  { key: 'delivery', href: '/delivery' },
  { key: 'privacyPolicy', href: '/privacy-policy' },
  { key: 'impressum', href: '/impressum' },
] as const;

// docs/design.md → Iconography: лапка — единственная брендовая иконка проекта (растровая, не
// перекрашивается); для соцсетей готовых брендовых иконок в lucide-react нет — минимальные inline
// SVG прямо здесь, без новой зависимости, воспроизведены по памяти (не трассировка официального
// файла) — визуально узнаваемы, но не гарантированно пиксель-в-пиксель как официальный ассет.
// Facebook — сплошная заливка (design.md → Footer «Facebook — единственная иконка со сплошной
// заливкой»), Instagram/TikTok — в общей аутлайн/солид-логике остальных иконок Footer.
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82c-.7-.77-1.1-1.76-1.1-2.82h-3.05v13.44a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.02 3.37-2.48V10.7c-3.45-.46-6.47 2.22-6.47 5.66 0 3.35 2.76 5.64 5.64 5.64 3.09 0 5.6-2.51 5.6-5.6V9.4a7.98 7.98 0 0 0 4.68 1.5V7.85c-1.11 0-2.14-.35-3-.95a5.4 5.4 0 0 1-.48-1.08Z" />
    </svg>
  );
}

// TODO: href пока заглушки — подставить реальные ссылки на соцсети заказчика.
const FOOTER_SOCIALS = [
  { key: 'facebook', href: '#', Icon: FacebookIcon },
  { key: 'instagram', href: '#', Icon: InstagramIcon },
  { key: 'tiktok', href: '#', Icon: TikTokIcon },
] as const;

// py-xs: text-label-md сам по себе даёт кликабельную область ~17px (14px/1.2) — ниже минимума
// touch target 24×24px по WCAG 2.2 §2.5.8 (проверено getBoundingClientRect). Паддинг компенсирован
// уменьшенным gap у родительского списка (см. использование ниже), чтобы визуальный интервал между
// пунктами не увеличился.
const LINK_CLASSNAME = `text-label-md py-xs transition-colors duration-fast hover:text-paw motion-reduce:transition-none ${FOCUS_RING_CLASSNAME}`;

export async function Footer() {
  const t = await getTranslations('Footer');
  const year = new Date().getFullYear();

  return (
    // pb-[5px] намеренно не симметричен pt — низ страницы, а не отступ между секциями. pt —
    // единственный источник правды для отступа перед Footer (design.md → Typography, «Отступ
    // перед Footer»); страницы-обёртки свой pb-* снизу не добавляют.
    <footer className="max-w-container px-lg mx-auto pt-[80px] pb-[5px]">
      {/* Точечный брейкпоинт 800/801px вместо стандартного sm — причина и разбор в design.md
          → Footer → «Адаптив ниже bp-sm». Важно не забыть при правке: max-[Npx] в Tailwind v4
          компилируется как "< Npx", не "<= Npx" — пара обязана быть max-[801px]/min-[801px],
          иначе на границе 800px раскладка и паддинги/шрифт разъедутся. */}
      <div className="gap-md grid grid-cols-1 min-[801px]:grid-cols-[1.5fr_1fr_0.75fr] min-[801px]:grid-rows-2">
        <div className="gap-md rounded-footer-mobile bg-paw text-surface min-[801px]:rounded-tr-card min-[801px]:rounded-br-card flex flex-col justify-between p-[30px] max-[801px]:p-[20px] min-[801px]:col-start-1 min-[801px]:row-span-2 min-[801px]:row-start-1 min-[801px]:rounded-tl-2xl min-[801px]:rounded-bl-2xl">
          <p className="text-[50px] leading-[1.15] font-semibold whitespace-pre-line max-[801px]:text-[40px]">
            {t('tagline')}
          </p>
          <div className="gap-sm flex items-center">
            {/* h-5 w-5 (20px) намеренно меньше логотипа в Header (32px) — здесь это мелкий
                акцент рядом с copyright, не сам логотип; width/height=32 оставлены под
                исходник, next/image сам подберёт качество под рендер-размер. */}
            <Image
              src="/logo-white.png"
              alt=""
              width={32}
              height={32}
              className="h-5 w-5 shrink-0"
            />
            <p className="text-label-caps text-surface">{t('copyright', { year })}</p>
          </div>
        </div>

        <div className="gap-sm rounded-footer-mobile bg-secondary text-on-secondary flex flex-col p-[30px] max-[801px]:p-[20px] min-[801px]:col-start-2 min-[801px]:row-start-1 min-[801px]:rounded-xl">
          <h2 className="text-label-md text-neutral-900">{t('supportTitle')}</h2>
          <p className="text-body-sm">{t('supportText')}</p>
          {/* self-start — та же причина, что items-start у соседних блоков (Contact/Follow us):
              без него flex-col растягивает ссылку на всю ширину карточки (align-items: stretch),
              и клик правее e-mail тоже попадал бы по ссылке. items-start на самом div не подходит
              — h2/p должны остаться на всю ширину карточки, иначе текст p перестанет переноситься
              по словам. */}
          <a
            href={`mailto:${t('supportEmail')}`}
            className={`text-label-md self-start font-semibold text-neutral-900 underline ${FOCUS_RING_CLASSNAME}`}
          >
            {t('supportEmail')}
          </a>
        </div>

        <div className="rounded-footer-mobile bg-paw-tint p-[30px] text-neutral-900 max-[801px]:p-[20px] min-[801px]:col-start-2 min-[801px]:row-start-2 min-[801px]:rounded-xl">
          {/* Contact/Delivery/Privacy Policy/Impressum — все четыре ведут на реальные маршруты,
              поэтому все четыре внутри одного <nav aria-label="Footer links">: раньше Contact
              (h2-ссылка) стоял снаружи nav, а остальные три — внутри, и скринридер, идущий по
              лендмаркам, не увидел бы Contact частью той же группы ссылок. В отличие от заголовков
              соседних карточек (Support/Follow us — обычный текст, не ссылка), Contact кликабелен
              и дублирует маршрут /contact из nav-list Header — эта асимметрия (h2-ссылка vs.
              h2-текст) осознанная, не забытая правка, landmark-группировки она не касается.
              text-label-md — на самом h2, не только на дочернем Link: без класса тег наследовал
              дефолтные font-size/line-height браузера (16px/1.5 → 24px, Tailwind Preflight base),
              а не токен — сам Link внутри был стилизован верно (14/16.8), но бокс h2 оставался на
              7px выше соседних заголовков, и вся строка из трёх карточек визуально «плыла».
              gap-xs на самом nav + py-xs у каждой ссылки = единые 12px между всеми строками
              (Contact/Delivery/Privacy Policy) — та же формула, что у списка соцсетей ниже.
              items-start обязателен: без него flex-col растягивает каждую ссылку (кроме Contact,
              она внутри h2, а не прямой flex-item) по умолчанию (align-items: stretch) на всю
              ширину карточки — сам текст остаётся слева, но кликабельным становится весь бокс
              вплоть до правого края карточки, а не только видимый текст. */}
          <nav aria-label={t('linksNav')} className="gap-xs flex flex-col items-start">
            <h2 className="text-label-md">
              <Link href="/contact" className={LINK_CLASSNAME}>
                {t('contactTitle')}
              </Link>
            </h2>
            {FOOTER_LINKS.map((link) => (
              <Link key={link.key} href={link.href} className={LINK_CLASSNAME}>
                {t(link.key)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="gap-md rounded-footer-mobile bg-paw-tint min-[801px]:rounded-tl-card min-[801px]:rounded-bl-card flex flex-col p-[30px] text-neutral-900 max-[801px]:p-[20px] min-[801px]:col-start-3 min-[801px]:row-span-2 min-[801px]:row-start-1 min-[801px]:rounded-tr-2xl min-[801px]:rounded-br-2xl">
          {/* text-[15px] поверх text-label-md — точечное укрупнение кегля только «Follow us»
              (15px вместо общих 14px), не общий токен text-label-md (используется у соседних
              заголовков Support/Contact и по всему сайту). line-height/font-weight остаются
              от label-md (1.2/600). */}
          <h2 className="text-label-md text-[15px]">{t('socialTitle')}</h2>
          {/* gap-xs у списка + py-xs у ссылки = те же 12px между строками, что и раньше
              (4 + 4 + 4), но кликабельная область каждой ссылки выросла с 20px до 28px — иначе
              не проходит минимум touch target 24×24px по WCAG 2.2 §2.5.8. items-start — та же
              причина, что у linksNav выше: без него li растягивается на всю ширину карточки
              (align-items: stretch по умолчанию), и клик правее иконки+текста, по пустому месту
              карточки, тоже срабатывал бы как клик по ссылке. */}
          <ul className="gap-xs flex flex-col items-start">
            {FOOTER_SOCIALS.map(({ key, href, Icon }) => (
              <li key={key}>
                <a
                  href={href}
                  className={`gap-sm py-xs text-body-sm duration-fast hover:text-paw flex items-center transition-colors motion-reduce:transition-none ${FOCUS_RING_CLASSNAME}`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {t(key)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
