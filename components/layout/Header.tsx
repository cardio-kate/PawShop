'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Menu, Search, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Logo } from './Logo';
import { LocaleSwitcher } from './LocaleSwitcher';
import { useCartStore } from '@/lib/store/cart.store';
import { CartButton } from '@/components/cart/CartButton';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { useResolvedCartItemCount } from '@/components/cart/useResolvedCartItems';
import { FOCUSABLE_SELECTOR } from '@/components/ui/Panel';
import {
  FOCUS_RING_CLASSNAME,
  iconActionButtonClassName,
} from '@/components/ui/interaction-styles';
import { useSyncedValue } from '@/lib/hooks/useSyncedValue';

// Search/mobile-nav/cart и так были взаимоисключающими по построению (каждый opener сбрасывал
// два других вручную) — один `activePanel` вместо трёх независимых boolean делает этот инвариант
// структурным: новую четвёртую панель нельзя добавить, забыв сбросить остальные, потому что тут
// просто нет "остальных" — есть одно значение.
type Panel = 'search' | 'mobileNav' | 'cart' | null;

const ANCHOR_NAV_ITEMS = [
  { key: 'about', id: 'about' },
  { key: 'newArrivals', id: 'new-arrivals' },
] as const;

const ROUTE_NAV_ITEMS = [
  { key: 'catalog', href: '/catalog' },
  { key: 'contact', href: '/contact' },
] as const;

// body-md (15px) + font-semibold override — токена «15px/600» в шкале нет (body-md всегда 400,
// label-md жирный только на 14px), точечная комбинация вместо нового токена под одно место
// использования. 600 — та же жирность, что уже проверялась на label-md и хорошо отделяла нав от
// текста страницы, здесь просто на новом размере.
const NAV_LINK_CLASSNAME = `text-body-md font-semibold text-neutral-900 transition-colors duration-fast hover:text-paw motion-reduce:transition-none ${FOCUS_RING_CLASSNAME}`;

// -translate-y-px: чисто оптическая поправка — геометрически кнопка уже центрирована по высоте
// шапки так же, как текст нав/EN-DE (проверено getBoundingClientRect, centerY совпадает), но
// иконка внутри квадрата 20×20 визуально «тяжелее» в центре, чем текст, у которого масса букв
// смещена к верху строки — без сдвига иконка читается ниже текста, хотя оба центрированы.
// Форма/цвет/hover/focus-ring — общий iconActionButtonClassName('trigger'), поправка положения
// остаётся здесь же, на вызывающей стороне (та же граница ответственности, что и в остальных
// местах, использующих этот хелпер).
const HEADER_TRIGGER_ICON_BUTTON_CLASSNAME = `${iconActionButtonClassName('trigger')} -translate-y-px`;

// focus-visible:-outline-offset-2 (inset), не общий FOCUS_RING_CLASSNAME (outset offset-2): пункты
// меню — edge-to-edge на всю ширину Header (px у самого <nav> нет, только у ссылки внутри), а Header
// на этой ширине начинается ровно от края viewport (inset-x-0 без паддинга). Обычный внешний ring
// на крайних пунктах уходил бы за 0/100vw и обрезался бы окном — inset-ring решает это, оставаясь
// видимым. Не унифицировано с FOCUS_RING_CLASSNAME: единственное место в проекте с этим требованием
// (edge-to-edge интерактивный элемент), заводить общий токен под один вызов — преждевременно.
const MOBILE_NAV_LINK_CLASSNAME =
  'px-[15px] py-[12.5px] text-body-md text-neutral-900 transition-colors duration-fast hover:bg-paw-tint hover:text-paw motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-paw';

export function Header() {
  const t = useTranslations('Header');
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemCount = useResolvedCartItemCount();

  const searchParam = searchParams.get('search') ?? '';
  const [activePanel, setActivePanel] = useState<Panel>(searchParam.length > 0 ? 'search' : null);
  const [query, setQuery] = useState(searchParam);
  const isSearchOpen = activePanel === 'search';
  const isMobileNavOpen = activePanel === 'mobileNav';
  const isCartOpen = activePanel === 'cart';

  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pendingSearchFocusReturn = useRef(false);
  const mobileNavTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);

  // Реагирует на ?search=, меняющийся снаружи компонента (переход по ссылке, кнопка «назад») —
  // тот же паттерн "adjust state during render", что и в CatalogClient.tsx, общий хук
  // useSyncedValue (lib/hooks/). Непустой параметр берёт панель под поиск безусловно (тот же
  // инвариант, что у openSearch() ниже — «поиск открыт ⇒ ничего другого не открыто»), пустой —
  // закрывает поиск, только если он и был активной панелью (не отнимает cart/mobileNav, которые
  // могли открыться независимо от URL).
  useSyncedValue(searchParam, (value) => {
    setQuery(value);
    if (value.length > 0) {
      setActivePanel('search');
    } else {
      setActivePanel((current) => (current === 'search' ? null : current));
    }
  });

  // cart.store.ts: skipHydration — сервер не знает содержимое localStorage, поэтому гидратация
  // запускается вручную здесь, на клиенте после маунта (architecture.md, «Гидратация счётчика
  // корзины в Header»). Header — общий layout над всеми страницами витрины, поэтому это
  // единственное место, где вызов нужен, а не в каждом потребителе стора по отдельности.
  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  // Мобильное меню рисует свой backdrop на весь viewport (fixed inset-0, см. ниже), но без этого
  // страница под ним оставалась скроллящейся — тот же провал, что Panel.tsx закрывает через
  // document.body.style.overflow при открытии панели корзины.
  useEffect(() => {
    if (!isMobileNavOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileNavOpen]);

  // «Close search»-кнопка размонтируется вместе с формой в момент клика — браузер иначе
  // роняет фокус на body. Триггер-кнопка появляется только после ре-рендера, поэтому фокус
  // переносим на неё эффектом, а не сразу в обработчике.
  useEffect(() => {
    if (!isSearchOpen && pendingSearchFocusReturn.current) {
      pendingSearchFocusReturn.current = false;
      searchTriggerRef.current?.focus();
    }
  }, [isSearchOpen]);

  function closeSearch() {
    pendingSearchFocusReturn.current = true;
    setActivePanel(null);
    setQuery('');
  }

  function clearSearchQuery() {
    setQuery('');
    searchInputRef.current?.focus();
  }

  function openSearch() {
    setActivePanel('search');
  }

  function openCart() {
    setActivePanel('cart');
  }

  function toggleMobileNav() {
    setActivePanel((current) => (current === 'mobileNav' ? null : 'mobileNav'));
  }

  function closeMobileNav() {
    setActivePanel(null);
    mobileNavTriggerRef.current?.focus();
  }

  // Escape закрывает независимо от фокуса внутри блока (как и раньше). Tab — тот же focus-trap,
  // что у Panel.tsx (handleTabKey), но границы считаются вручную (триггер + querySelectorAll
  // внутри самого <nav>), а не по всему обёрточному div — тот же div несёт ещё и десктопный
  // Logo-линк (`hidden sm:flex`): querySelectorAll не знает про display:none и включил бы его
  // в список фокусируемых, хотя реальный Tab браузера его пропускает (не в фокус-дереве) — «конец»
  // списка никогда бы не совпал с document.activeElement, и trap молча не срабатывал бы.
  function handleMobileNavKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      closeMobileNav();
      return;
    }

    if (
      e.key !== 'Tab' ||
      !isMobileNavOpen ||
      !mobileNavRef.current ||
      !mobileNavTriggerRef.current
    )
      return;

    const focusable = [
      mobileNavTriggerRef.current,
      ...mobileNavRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/catalog?search=${encodeURIComponent(trimmed)}`);
  }

  // Тот же принцип, что у Panel.tsx (корзина) и handleMobileNavKeyDown выше — любая раскрытая
  // панель Header закрывается по Escape независимо от того, где внутри неё стоит фокус (инпут,
  // clear-крестик, close-крестик). До этого фикса у поиска такого обработчика не было вообще —
  // единственный способ свернуть его с клавиатуры был Tab до close-кнопки и Enter.
  function handleSearchKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    if (e.key === 'Escape') closeSearch();
  }

  const navHref = (id: string) => (pathname === '/' ? `#${id}` : `/#${id}`);
  // Корзина узкая сама по себе — места на планшете/десктопе ей хватает всегда, поэтому при поиске
  // прячется только на настоящем телефоне (< sm), где вообще нет запаса ширины (см. её className
  // ниже). Десктопный логотип из этой логики не трогаем — у него уже есть своё правило видимости
  // по брейкпоинту (hidden ... sm:flex), независимое от поиска.
  //
  // А вот nav (4 пункта) — тот самый «тяжёлый» элемент: рядом с рабочим полем поиска (иконка +
  // инпут + до двух крестиков) он не помещается вплоть до 1024px (lg), даже когда логотип и
  // корзина уже не мешают. Поэтому именно nav прячется в расширенном диапазоне "< lg" — но тогда
  // на 640–1024px не остаётся вообще никакого способа вернуться к навигации, кроме закрытия
  // поиска (бургер там по умолчанию не существует, он `sm:hidden`). Поэтому у самой кнопки-бургера
  // ниже (className) отдельное правило видимости на время поиска: `lg:hidden` вместо обычного
  // `sm:hidden` — она берёт на себя роль резервного триггера навигации ровно в том диапазоне, где
  // прячется desktop-nav, и мобильное выпадающее меню (тот же дропдаун, что и на телефоне) должно
  // уметь показываться на этой же ширине — см. соответствующие классы у backdrop/`<nav>` ниже.
  const hiddenNavWhenSearchOpen = isSearchOpen ? 'hidden lg:flex' : 'flex';

  return (
    <header className="bg-paw-tint sticky top-0 z-50 border-b border-neutral-200">
      <div
        className={`max-w-container gap-md sm:px-lg mx-auto h-20 items-center px-[10px] ${
          isSearchOpen ? 'flex' : 'grid grid-cols-[1fr_auto_1fr]'
        } sm:flex sm:justify-between`}
      >
        <div className="flex shrink-0 items-center" onKeyDown={handleMobileNavKeyDown}>
          {/* Без aria-controls: mobile-nav-menu монтируется только при isMobileNavOpen, в закрытом
              состоянии ссылка указывала бы на несуществующий id. aria-expanded + aria-label уже
              полностью описывают состояние. */}
          <button
            ref={mobileNavTriggerRef}
            type="button"
            onClick={toggleMobileNav}
            aria-label={isMobileNavOpen ? t('closeMenu') : t('openMenu')}
            aria-expanded={isMobileNavOpen}
            className={`${HEADER_TRIGGER_ICON_BUTTON_CLASSNAME} ${isSearchOpen ? 'lg:hidden' : 'sm:hidden'}`}
          >
            {isMobileNavOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>

          {/* В DOM сразу после кнопки-триггера (а не в конце шапки, после поиска/корзины) —
              иначе Tab после открытия меню уводит через несвязанные иконки прежде, чем в сам
              список (WCAG 2.4.3). Визуально на месте остаётся за счёт absolute/top-full: header
              — ближайший position:sticky-предок, поэтому inset-x-0 растягивает список на всю его
              ширину независимо от того, что по DOM он вложен в узкую первую колонку грида. */}
          {isMobileNavOpen && (
            // Затемнение остальной страницы под выпадающим списком — без него на мобильном было
            // видно часть контента ниже меню, и граница «где список, а где уже страница» терялась.
            // fixed (не absolute) — перекрывает весь viewport независимо от контейнера header;
            // идёт в DOM раньше <nav>, поэтому на одном уровне стека (оба position, оба z-auto)
            // список рисуется поверх, а не наоборот. Клик по подложке закрывает меню — тот же UX,
            // что у Panel (корзина/admin-модалки).
            //
            // lg:hidden, не sm:hidden: сам триггер (кнопка выше) теперь тоже видим до lg на время
            // поиска (см. комментарий у hiddenNavWhenSearchOpen) — если открыть меню оттуда, ему
            // нужно уметь фактически отрисоваться на этой же ширине, а не только < sm.
            <div
              className="fixed inset-0 bg-neutral-900/40 lg:hidden"
              onClick={closeMobileNav}
              aria-hidden="true"
            />
          )}

          {isMobileNavOpen && (
            <nav
              ref={mobileNavRef}
              id="mobile-nav-menu"
              aria-label={t('mainNav')}
              className="bg-surface py-sm absolute inset-x-0 top-full flex flex-col border-t border-neutral-200 lg:hidden"
            >
              {ANCHOR_NAV_ITEMS.map((item) => (
                <a
                  key={item.id}
                  href={navHref(item.id)}
                  onClick={() => setActivePanel(null)}
                  className={MOBILE_NAV_LINK_CLASSNAME}
                >
                  {t(item.key)}
                </a>
              ))}
              {ROUTE_NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setActivePanel(null)}
                  className={MOBILE_NAV_LINK_CLASSNAME}
                >
                  {t(item.key)}
                </Link>
              ))}
              {/* LocaleSwitcher не входит в основной ряд иконок Header на мобильном — там и так
                  впритык места нет (design.md → Header, ширина 320–375px). Дублируется здесь же,
                  как Catalog/Contact выше, только по другой причине: не недостижимый маршрут, а
                  нехватка горизонтального места в самой шапке. sm:hidden — начиная с 640px в самой
                  шапке уже есть независимый инлайн LocaleSwitcher (третья колонка, `hidden
                  sm:block`), он не зависит от поиска и виден и тогда, когда это меню открыто
                  резервным бургером на 640–1024px (см. hiddenNavWhenSearchOpen) — без sm:hidden
                  здесь на этой ширине было бы два переключателя языка одновременно. */}
              <div className="flex items-center justify-between border-t border-neutral-200 px-[15px] py-[12.5px] sm:hidden">
                <span className="text-body-md text-neutral-700">{t('language')}</span>
                <LocaleSwitcher onNavigate={() => setActivePanel(null)} />
              </div>
            </nav>
          )}

          <Link href="/" className={`hidden items-center gap-2 ${FOCUS_RING_CLASSNAME} sm:flex`}>
            <Logo />
          </Link>
        </div>

        <div
          className={`shrink-0 items-center justify-center ${hiddenNavWhenSearchOpen} sm:justify-start`}
        >
          <Link href="/" className={`${FOCUS_RING_CLASSNAME} sm:hidden`}>
            <Logo stacked />
          </Link>

          {/* Ни gap-[12px], ни gap-[18px] не по шкале — осознанно: gap-lg (24px) на sm..lg
              визуально расползался. По прямому запросу — три шага: gap-[12px] на sm..md
              (640–767px), gap-[18px] на md..lg (768–1023px, ~1000px — заметно шире). lg:gap-xl
              (40px), не lg:gap-lg (24px) — по прямому запросу, шире на просторном
              desktop-разрешении. */}
          <nav
            aria-label={t('mainNav')}
            className="lg:gap-xl hidden shrink-0 items-center gap-[12px] sm:flex md:gap-[18px]"
          >
            {ANCHOR_NAV_ITEMS.map((item) => (
              <a key={item.id} href={navHref(item.id)} className={NAV_LINK_CLASSNAME}>
                {t(item.key)}
              </a>
            ))}
            {ROUTE_NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className={NAV_LINK_CLASSNAME}>
                {t(item.key)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="gap-sm flex min-w-0 items-center justify-end">
          <div className="hidden sm:block">
            <LocaleSwitcher />
          </div>

          {isSearchOpen ? (
            <form
              onSubmit={handleSearchSubmit}
              onKeyDown={handleSearchKeyDown}
              role="search"
              className="gap-sm px-md py-sm focus-within:border-paw flex w-full min-w-0 items-center rounded-full border border-neutral-300 lg:w-56"
            >
              <label htmlFor="header-search-input" className="sr-only">
                {t('searchAriaLabel')}
              </label>
              <Search className="h-4 w-4 shrink-0 text-neutral-700" aria-hidden="true" />
              <input
                ref={searchInputRef}
                id="header-search-input"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                autoFocus
                className="text-body-sm w-full min-w-0 text-neutral-900 outline-none placeholder:text-neutral-500"
              />
              {query.length > 0 && (
                <button
                  type="button"
                  onClick={clearSearchQuery}
                  aria-label={t('clearSearch')}
                  className={`shrink-0 ${iconActionButtonClassName('muted')}`}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={closeSearch}
                aria-label={t('closeSearch')}
                className={`shrink-0 ${iconActionButtonClassName('muted')}`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          ) : (
            // Без aria-controls: header-search-input монтируется только при isSearchOpen, в
            // закрытом состоянии ссылка указывала бы на несуществующий id (см. комментарий
            // у бургер-кнопки выше).
            <button
              ref={searchTriggerRef}
              type="button"
              onClick={openSearch}
              aria-label={t('openSearch')}
              aria-expanded={isSearchOpen}
              className={HEADER_TRIGGER_ICON_BUTTON_CLASSNAME}
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>
          )}

          <CartButton
            itemCount={itemCount}
            onClick={openCart}
            label={itemCount > 0 ? t('openCartWithCount', { count: itemCount }) : t('openCart')}
            className={`${HEADER_TRIGGER_ICON_BUTTON_CLASSNAME} ${isSearchOpen ? 'hidden sm:block' : ''}`}
          />
        </div>
      </div>

      <CartDrawer open={isCartOpen} onClose={() => setActivePanel(null)} />
    </header>
  );
}
