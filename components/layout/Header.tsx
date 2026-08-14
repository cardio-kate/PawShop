'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Menu, Search, ShoppingCart, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Logo } from './Logo';
import { LocaleSwitcher } from './LocaleSwitcher';
import { useCartItemCount, useCartStore } from '@/lib/store/cart.store';

const ANCHOR_NAV_ITEMS = [
  { key: 'about', id: 'about' },
  { key: 'newArrivals', id: 'new-arrivals' },
] as const;

const ROUTE_NAV_ITEMS = [
  { key: 'catalog', href: '/catalog' },
  { key: 'contact', href: '/contact' },
] as const;

const NAV_LINK_CLASSNAME =
  'text-label-md text-neutral-900 transition-colors duration-fast hover:text-paw motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

// -translate-y-px: чисто оптическая поправка — геометрически кнопка уже центрирована по высоте
// шапки так же, как текст нав/EN-DE (проверено getBoundingClientRect, centerY совпадает), но
// иконка внутри квадрата 20×20 визуально «тяжелее» в центре, чем текст, у которого масса букв
// смещена к верху строки — без сдвига иконка читается ниже текста, хотя оба центрированы.
const HEADER_TRIGGER_ICON_BUTTON_CLASSNAME =
  'cursor-pointer rounded-full p-1 -translate-y-px text-neutral-900 transition-colors duration-fast hover:text-paw motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

const MOBILE_NAV_LINK_CLASSNAME =
  'px-[15px] py-[12.5px] text-body-md text-neutral-900 transition-colors duration-fast hover:bg-primary-tint hover:text-paw motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary';

export function Header() {
  const t = useTranslations('Header');
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemCount = useCartItemCount();

  const searchParam = searchParams.get('search') ?? '';
  const [syncedSearchParam, setSyncedSearchParam] = useState(searchParam);
  const [isSearchOpen, setIsSearchOpen] = useState(searchParam.length > 0);
  const [query, setQuery] = useState(searchParam);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pendingSearchFocusReturn = useRef(false);
  const mobileNavTriggerRef = useRef<HTMLButtonElement>(null);

  if (searchParam !== syncedSearchParam) {
    setSyncedSearchParam(searchParam);
    setIsSearchOpen(searchParam.length > 0);
    setQuery(searchParam);
    // Тот же инвариант «поиск открыт ⇒ бургер закрыт», что и в openSearch() — сюда можно
    // попасть в обход неё (например, client-side навигация назад на URL с ?search=), пока
    // бургер-меню открыто на другой странице.
    if (searchParam.length > 0) {
      setIsMobileNavOpen(false);
    }
  }

  // cart.store.ts: skipHydration — сервер не знает содержимое localStorage, поэтому гидратация
  // запускается вручную здесь, на клиенте после маунта (architecture.md, «Гидратация счётчика
  // корзины в Header»). Header — общий layout над всеми страницами витрины, поэтому это
  // единственное место, где вызов нужен, а не в каждом потребителе стора по отдельности.
  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

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
    setIsSearchOpen(false);
    setQuery('');
  }

  function clearSearchQuery() {
    setQuery('');
    searchInputRef.current?.focus();
  }

  function openSearch() {
    setIsMobileNavOpen(false);
    setIsSearchOpen(true);
  }

  function toggleMobileNav() {
    setIsSearchOpen(false);
    setIsMobileNavOpen((open) => !open);
  }

  function closeMobileNav() {
    setIsMobileNavOpen(false);
    mobileNavTriggerRef.current?.focus();
  }

  function handleMobileNavKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      closeMobileNav();
    }
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/catalog?search=${encodeURIComponent(trimmed)}`);
  }

  const navHref = (id: string) => (pathname === '/' ? `#${id}` : `/#${id}`);
  // Логотип и корзина сами по себе узкие — места на планшете/десктопе им хватает всегда, поэтому
  // при поиске прячутся только на настоящем телефоне (< sm), где вообще нет запаса ширины.
  const hiddenLogoWhenSearchOpen = isSearchOpen ? 'hidden sm:flex' : 'flex';
  // А вот nav (4 пункта) — тот самый «тяжёлый» элемент: рядом с рабочим полем поиска (иконка +
  // инпут + до двух крестиков) он не помещается вплоть до 1024px (lg), даже когда логотип и
  // корзина уже не мешают. Поэтому именно nav прячется в расширенном диапазоне "< lg", а не
  // логотип/корзина.
  const hiddenNavWhenSearchOpen = isSearchOpen ? 'hidden lg:flex' : 'flex';

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-surface">
      <div
        className={`mx-auto h-20 max-w-container items-center gap-md px-[10px] sm:px-lg ${
          isSearchOpen ? 'flex' : 'grid grid-cols-[1fr_auto_1fr]'
        } sm:flex sm:justify-between`}
      >
        <div className={`shrink-0 items-center ${hiddenLogoWhenSearchOpen}`} onKeyDown={handleMobileNavKeyDown}>
          {/* Без aria-controls: mobile-nav-menu монтируется только при isMobileNavOpen, в закрытом
              состоянии ссылка указывала бы на несуществующий id. aria-expanded + aria-label уже
              полностью описывают состояние. */}
          <button
            ref={mobileNavTriggerRef}
            type="button"
            onClick={toggleMobileNav}
            aria-label={isMobileNavOpen ? t('closeMenu') : t('openMenu')}
            aria-expanded={isMobileNavOpen}
            className={`${HEADER_TRIGGER_ICON_BUTTON_CLASSNAME} sm:hidden`}
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
            <nav
              id="mobile-nav-menu"
              aria-label={t('mainNav')}
              className="absolute inset-x-0 top-full flex flex-col border-t border-neutral-200 bg-surface py-sm sm:hidden"
            >
              {ANCHOR_NAV_ITEMS.map((item) => (
                <a
                  key={item.id}
                  href={navHref(item.id)}
                  onClick={() => setIsMobileNavOpen(false)}
                  className={MOBILE_NAV_LINK_CLASSNAME}
                >
                  {t(item.key)}
                </a>
              ))}
              {ROUTE_NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileNavOpen(false)}
                  className={MOBILE_NAV_LINK_CLASSNAME}
                >
                  {t(item.key)}
                </Link>
              ))}
              {/* LocaleSwitcher не входит в основной ряд иконок Header на мобильном — там и так
                  впритык места нет (design.md → Header, ширина 320–375px). Дублируется здесь же,
                  как Catalog/Contact выше, только по другой причине: не недостижимый маршрут, а
                  нехватка горизонтального места в самой шапке. */}
              <div className="flex items-center justify-between border-t border-neutral-200 px-[15px] py-[12.5px]">
                <span className="text-body-md text-neutral-700">{t('language')}</span>
                <LocaleSwitcher onNavigate={() => setIsMobileNavOpen(false)} />
              </div>
            </nav>
          )}

          <Link
            href="/"
            className="hidden items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:flex"
          >
            <Logo />
          </Link>
        </div>

        <div className={`shrink-0 items-center justify-center ${hiddenNavWhenSearchOpen} sm:justify-start`}>
          <Link
            href="/"
            className="flex flex-col items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:hidden"
          >
            <Image src="/logo.png" alt="" width={32} height={32} className="h-8 w-8 shrink-0" priority />
            <span className="text-h3 text-neutral-900">PawShop</span>
          </Link>

          {/* gap-[12px] не по шкале — осознанно: на sm..lg gap-lg (24px) визуально расползался. */}
          <nav aria-label={t('mainNav')} className="hidden shrink-0 items-center gap-[12px] sm:flex lg:gap-lg">
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

        <div className="flex min-w-0 items-center justify-end gap-sm">
          <div className="hidden sm:block">
            <LocaleSwitcher />
          </div>

          {isSearchOpen ? (
            <form
              onSubmit={handleSearchSubmit}
              role="search"
              className="flex min-w-0 w-full items-center gap-sm rounded-full border border-neutral-300 px-md py-sm focus-within:border-primary lg:w-56"
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
                className="w-full min-w-0 text-body-sm text-neutral-900 outline-none placeholder:text-neutral-500"
              />
              {query.length > 0 && (
                <button
                  type="button"
                  onClick={clearSearchQuery}
                  aria-label={t('clearSearch')}
                  className="shrink-0 cursor-pointer rounded-full p-1 text-neutral-500 hover:text-paw focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={closeSearch}
                aria-label={t('closeSearch')}
                className="shrink-0 cursor-pointer rounded-full p-1 text-neutral-500 hover:text-paw focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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

          <button
            type="button"
            // TODO: открывать панель корзины (design.md → Cart item / panel) — компонент ещё не реализован.
            aria-label={itemCount > 0 ? t('openCartWithCount', { count: itemCount }) : t('openCart')}
            className={`relative shrink-0 ${HEADER_TRIGGER_ICON_BUTTON_CLASSNAME} ${isSearchOpen ? 'hidden sm:block' : ''}`}
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {itemCount > 0 && (
              // Не bg-primary: реальный цвет пикселей public/logo.png (усреднено по всем
              // непрозрачным пикселям) — #685393, заметно приглушённее токена primary (#4F51C7).
              // Бейдж намеренно повторяет цвет лапки-лого для брендовой связки — токен colors.paw
              // в tailwind.config.ts. Контраст с белым текстом — 6.47:1, WCAG AA ок.
              <span
                aria-hidden="true"
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-paw px-1 text-[10px] font-semibold leading-none text-surface"
              >
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
