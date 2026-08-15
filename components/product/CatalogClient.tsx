'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, SearchX } from 'lucide-react';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { ProductCard } from '@/components/product/ProductCard';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '@/components/product/mock-data';
import { getProductGridColumnsClassName } from '@/components/product/getProductGridColumnsClassName';
import type { AgeGroup } from '@/types';

const AGE_GROUPS: AgeGroup[] = ['kitten', 'adult', 'senior'];
// design.md → Layout «Пагинация»: 8 товаров на страницу (2 полных ряда по 4 колонки на десктопе),
// то же значение зафиксировано и в architecture.md как дефолт limit для будущего getProducts().
const PAGE_SIZE = 8;

// design.md → Components «Price range filter»: py-xs (29.5px) заметно ниже соседних чипов
// (37.5px) на одной строке фильтров — py-sm выравнивает высоту.
const PRICE_FIELD_CLASSNAME =
  'w-20 rounded-md border border-neutral-300 bg-surface px-[12px] py-sm text-body-sm text-neutral-900 outline-none transition-colors duration-fast placeholder:text-neutral-500 motion-reduce:transition-none focus:border-paw';

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-sm sm:flex-row sm:items-center">
      <span className="text-label-md text-neutral-900 sm:w-28 sm:shrink-0">{label}</span>
      <div className="flex flex-wrap items-center gap-sm">{children}</div>
    </div>
  );
}

// design.md → Layout «Фильтры каталога» / «Пагинация» — панель над сеткой (не сайдбар), UI-состояние
// без реального запроса (getProducts() ещё не подключён, architecture.md §3.1) — фильтрация здесь
// выполняется прямо над мок-массивом на клиенте, а не через сервер.
export function CatalogClient() {
  const t = useTranslations('Catalog');
  const tProduct = useTranslations('Product');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') ?? '';

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<AgeGroup[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);
  // Инкрементируется только явным переходом по пагинации (goToPage), не сбросом страницы из
  // фильтров/поиска (те тоже дергают setPage(1), но пользователь и так уже наверху, скроллить
  // незачем) — счётчик, а не boolean, чтобы клик на уже активную соседнюю страницу (edge-кейс
  // currentPage=1 после clamp) тоже долетал до эффекта ниже.
  const [scrollToTopSignal, setScrollToTopSignal] = useState(0);

  // Смена страницы саму по себе не подводит вьюпорт к новым карточкам — без этого пользователь
  // остаётся проскроленным туда, где была пагинация внизу списка, и должен сам крутить вверх, чтобы
  // увидеть новую страницу. Скролл — в useEffect, а не сразу в обработчике клика: вызванный
  // синхронно с setPage, window.scrollTo({behavior:'smooth'}) стартовал анимацию до того, как
  // React перерисовывал сетку под новую (обычно более короткую) страницу — высота документа
  // менялась прямо под уже идущей анимацией, и браузер обрывал её на случайной промежуточной
  // позиции вместо 0 (проверено — сам вызов уходил с правильными аргументами, но не долистывал).
  // useEffect гарантированно выполняется после того, как DOM уже отражает новую страницу.
  function goToPage(p: number) {
    setPage(p);
    setScrollToTopSignal((s) => s + 1);
  }

  useEffect(() => {
    if (scrollToTopSignal === 0) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [scrollToTopSignal]);

  // Смена поискового запроса приходит снаружи (Header → router.push('/catalog?search=...')) —
  // тот же контракт, что и у остальных фильтров ниже: любое изменение условия сбрасывает на
  // страницу 1, а не оставляет пользователя на, например, третьей странице пустого результата.
  // Сброс состояния во время рендера (а не в useEffect) — официальный паттерн React для "adjusting
  // state when a prop changes" без лишнего цикла рендера/лишнего кадра со старой страницей.
  const [syncedSearch, setSyncedSearch] = useState(search);
  if (search !== syncedSearch) {
    setSyncedSearch(search);
    setPage(1);
  }

  function toggleCategory(id: string) {
    setSelectedCategories((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
    setPage(1);
  }

  function toggleAgeGroup(age: AgeGroup) {
    setSelectedAgeGroups((prev) => (prev.includes(age) ? prev.filter((a) => a !== age) : [...prev, age]));
    setPage(1);
  }

  function handleMinPriceChange(value: string) {
    setMinPrice(value);
    setPage(1);
  }

  function handleMaxPriceChange(value: string) {
    setMaxPrice(value);
    setPage(1);
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const min = minPrice === '' ? null : Number(minPrice);
    const max = maxPrice === '' ? null : Number(maxPrice);

    return MOCK_PRODUCTS.filter((product) => {
      if (query && !product.name.toLowerCase().includes(query)) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(product.categoryId)) return false;
      if (selectedAgeGroups.length > 0 && !selectedAgeGroups.includes(product.ageGroup)) return false;
      if (min !== null && !Number.isNaN(min) && product.price < min) return false;
      if (max !== null && !Number.isNaN(max) && product.price > max) return false;
      return true;
    });
  }, [search, selectedCategories, selectedAgeGroups, minPrice, maxPrice]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hasActiveFilters =
    selectedCategories.length > 0 || selectedAgeGroups.length > 0 || minPrice !== '' || maxPrice !== '' || search !== '';

  // design.md → Components «Empty state»: сбрасывает и фильтры, и поисковый запрос разом — состояние
  // «ничего не найдено» может быть вызвано любым из них по отдельности или всеми сразу. search
  // приходит из URL, поэтому чистим его через router.replace (тот же next/navigation router, что
  // Header использует для перехода в обратную сторону, /catalog?search=...) — простой
  // history.replaceState не обновил бы значение, которое здесь читает useSearchParams().
  function clearFilters() {
    setSelectedCategories([]);
    setSelectedAgeGroups([]);
    setMinPrice('');
    setMaxPrice('');
    setPage(1);
    if (search) {
      router.replace('/catalog');
    }
  }

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col gap-md border-b border-neutral-200 pb-lg">
        <FilterRow label={t('filters.category')}>
          {MOCK_CATEGORIES.map((category) => (
            <Chip
              key={category.id}
              selected={selectedCategories.includes(category.id)}
              onClick={() => toggleCategory(category.id)}
            >
              {locale === 'de' ? category.nameDe : category.nameEn}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label={t('filters.age')}>
          {AGE_GROUPS.map((age) => (
            <Chip key={age} selected={selectedAgeGroups.includes(age)} onClick={() => toggleAgeGroup(age)}>
              {t(`ageGroups.${age}`)}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label={t('filters.price')}>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={minPrice}
            onChange={(e) => handleMinPriceChange(e.target.value)}
            placeholder={t('filters.priceFrom')}
            aria-label={t('filters.priceFrom')}
            className={PRICE_FIELD_CLASSNAME}
          />
          <span className="text-body-sm text-neutral-500" aria-hidden="true">
            –
          </span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={maxPrice}
            onChange={(e) => handleMaxPriceChange(e.target.value)}
            placeholder={t('filters.priceTo')}
            aria-label={t('filters.priceTo')}
            className={PRICE_FIELD_CLASSNAME}
          />
        </FilterRow>
      </div>

      <p className="text-body-sm text-neutral-500" aria-live="polite">
        {t('resultsCount', { count: filtered.length })}
      </p>

      {pageItems.length > 0 ? (
        // Карточка не растягивается вместе с ячейкой грида — design.md → Layout, «Ширина самой
        // карточки при этом зафиксирована». Число колонок ограничено числом реальных карточек на
        // странице (getProductGridColumnsClassName) — при узких фильтрах/последней неполной странице
        // пустые track'и без карточки внутри всё равно растягивались бы до 290px (Maximize Tracks
        // не смотрит на контент), и результат висел бы у левого края вместо центрирования.
        <div className={`grid justify-items-center justify-center gap-gutter ${getProductGridColumnsClassName(pageItems.length)}`}>
          {pageItems.map((product) => (
            <div key={product.id} className="w-full max-w-[290px]">
              <ProductCard
                product={product}
                locale={locale}
                newLabel={tProduct('newBadge')}
                addToCartLabel={tProduct('addToCart', { name: product.name })}
                unavailableLabel={tProduct('unavailable', { name: product.name })}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-sm py-3xl text-center">
          <SearchX className="h-10 w-10 text-neutral-300" aria-hidden="true" />
          <p className="text-body-md text-neutral-900">{t('emptyTitle')}</p>
          <p className="text-body-sm text-neutral-500">{t('emptyDescription')}</p>
          {hasActiveFilters && (
            <Button variant="secondary" className="mt-sm" onClick={clearFilters}>
              {t('filters.clear')}
            </Button>
          )}
        </div>
      )}

      {pageCount > 1 && (
        <nav aria-label={t('pagination.ariaLabel')} className="flex items-center justify-center gap-xs pt-md">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => goToPage(Math.max(1, currentPage - 1))}
            aria-label={t('pagination.previous')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 transition-colors duration-fast hover:text-paw motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:text-neutral-300"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => goToPage(p)}
              aria-current={p === currentPage ? 'page' : undefined}
              aria-label={t('pagination.goToPage', { page: p })}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-label-md transition-colors duration-fast motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw ${
                p === currentPage ? 'bg-paw text-surface' : 'text-neutral-700 hover:text-paw'
              }`}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            disabled={currentPage === pageCount}
            onClick={() => goToPage(Math.min(pageCount, currentPage + 1))}
            aria-label={t('pagination.next')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 transition-colors duration-fast hover:text-paw motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw disabled:cursor-not-allowed disabled:hover:text-neutral-300 disabled:text-neutral-300"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}
