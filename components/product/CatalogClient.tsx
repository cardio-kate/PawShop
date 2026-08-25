'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyStateCat } from '@/components/ui/EmptyStateCat';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ProductCard } from '@/components/product/ProductCard';
import { getProducts } from '@/actions/products.actions';
import { getProductGridColumnsClassName } from '@/components/product/getProductGridColumnsClassName';
import { PRODUCT_CARD_GRID_GAP_CLASSNAME } from '@/components/product/product-grid-styles';
import { FOCUS_RING_CLASSNAME } from '@/components/ui/interaction-styles';
import { useSyncedValue } from '@/lib/hooks/useSyncedValue';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { CATALOG_PAGE_SIZE } from '@/lib/constants';
import type { AgeGroup } from '@/types';
import type { ResolvedProductListItem } from '@/lib/services/products.service';

const AGE_GROUPS: AgeGroup[] = ['kitten', 'adult', 'senior'];

interface CatalogCategory {
  id: number;
  nameEn: string;
  nameDe: string;
}

interface CatalogClientProps {
  categories: CatalogCategory[];
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="gap-sm flex flex-col sm:flex-row sm:items-center">
      <span className="text-label-md text-neutral-900 sm:w-28 sm:shrink-0">{label}</span>
      <div className="gap-sm flex flex-wrap items-center">{children}</div>
    </div>
  );
}

// design.md → Layout «Фильтры каталога» / «Пагинация» — панель над сеткой (не сайдбар). Источник
// данных — реальный getProducts() (architecture.md §3.1), не клиентский фильтр мок-массива:
// каждое изменение фильтра/страницы шлёт Server Action и подставляет ответ. category/minPrice/
// maxPrice идут через useDebouncedValue (~300мс, CLAUDE.md → «Заказ и корзина») — набор символов в
// поле цены не должен бить по БД на каждую цифру; search уже приходит из URL только по сабмиту
// формы поиска в Header.tsx (не на каждый keystroke), лишний debounce поверх не нужен.
export function CatalogClient({ categories }: CatalogClientProps) {
  const t = useTranslations('Catalog');
  const tProduct = useTranslations('Product');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') ?? '';

  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<AgeGroup[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);
  const [scrollToTopSignal, setScrollToTopSignal] = useState(0);

  const [products, setProducts] = useState<ResolvedProductListItem[]>([]);
  const [total, setTotal] = useState(0);
  // useTransition, не ручной useState<boolean> — React Compiler отклоняет setState синхронно в
  // теле эффекта (react-hooks/set-state-in-effect); startTransition(async () => {...}) в React 19
  // — идиоматичный способ пометить асинхронное обновление как не-срочное и получить isPending
  // без отдельного стейта на "загрузку".
  const [isPending, startTransition] = useTransition();

  const debouncedMinPrice = useDebouncedValue(minPrice);
  const debouncedMaxPrice = useDebouncedValue(maxPrice);

  function goToPage(p: number) {
    setPage(p);
    setScrollToTopSignal((s) => s + 1);
  }

  useEffect(() => {
    if (scrollToTopSignal === 0) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [scrollToTopSignal]);

  // Любое изменение условия фильтрации сбрасывает страницу на 1 — тот же общий хук, что и раньше
  // (components/product/CatalogClient.tsx, до перехода на реальные данные), сравнение идёт уже по
  // debounced-значениям цены, чтобы не сбрасывать страницу на каждую набранную цифру отдельно.
  const filtersKey = JSON.stringify([
    search,
    selectedCategories,
    selectedAgeGroups,
    debouncedMinPrice,
    debouncedMaxPrice,
  ]);
  useSyncedValue(filtersKey, () => setPage(1));

  // Гонка ответов: быстрое переключение фильтров может вернуть предыдущий (более медленный) запрос
  // позже следующего — requestId игнорирует любой ответ, кроме самого последнего отправленного.
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const min = debouncedMinPrice === '' ? undefined : Number(debouncedMinPrice);
    const max = debouncedMaxPrice === '' ? undefined : Number(debouncedMaxPrice);

    startTransition(async () => {
      const result = await getProducts({
        locale,
        category: selectedCategories.length > 0 ? selectedCategories : undefined,
        ageGroup: selectedAgeGroups.length > 0 ? selectedAgeGroups : undefined,
        priceFrom: min !== undefined && !Number.isNaN(min) ? min : undefined,
        priceTo: max !== undefined && !Number.isNaN(max) ? max : undefined,
        search: search || undefined,
        limit: CATALOG_PAGE_SIZE,
        offset: (page - 1) * CATALOG_PAGE_SIZE,
      });
      if (requestId !== requestIdRef.current) return; // устаревший ответ, проигнорирован
      if (result.success) {
        setProducts(result.data.products);
        setTotal(result.data.total);
      }
    });
  }, [locale, selectedCategories, selectedAgeGroups, debouncedMinPrice, debouncedMaxPrice, search, page]);

  function toggleCategory(id: number) {
    setSelectedCategories((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function toggleAgeGroup(age: AgeGroup) {
    setSelectedAgeGroups((prev) =>
      prev.includes(age) ? prev.filter((a) => a !== age) : [...prev, age],
    );
  }

  const pageCount = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedAgeGroups.length > 0 ||
    minPrice !== '' ||
    maxPrice !== '' ||
    search !== '';

  // design.md → Components «Empty state»: сбрасывает и фильтры, и поисковый запрос разом.
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

  const categoryLabel = useMemo(
    () => (category: CatalogCategory) => (locale === 'de' ? category.nameDe : category.nameEn),
    [locale],
  );

  return (
    <div className="gap-lg flex flex-col">
      <div className="gap-md pb-lg flex flex-col border-b border-neutral-200">
        <FilterRow label={t('filters.category')}>
          {categories.map((category) => (
            <Chip
              key={category.id}
              selected={selectedCategories.includes(category.id)}
              onClick={() => toggleCategory(category.id)}
            >
              {categoryLabel(category)}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label={t('filters.age')}>
          {AGE_GROUPS.map((age) => (
            <Chip
              key={age}
              selected={selectedAgeGroups.includes(age)}
              onClick={() => toggleAgeGroup(age)}
            >
              {t(`ageGroups.${age}`)}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label={t('filters.price')}>
          <div className="w-20">
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder={t('filters.priceFrom')}
              aria-label={t('filters.priceFrom')}
              compact
            />
          </div>
          <span className="text-body-sm text-neutral-500" aria-hidden="true">
            –
          </span>
          <div className="w-20">
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder={t('filters.priceTo')}
              aria-label={t('filters.priceTo')}
              compact
            />
          </div>
        </FilterRow>
      </div>

      <p className="text-body-sm text-neutral-500" aria-live="polite">
        {t('resultsCount', { count: total })}
      </p>

      {products.length > 0 ? (
        <div
          className={`grid justify-center justify-items-center ${PRODUCT_CARD_GRID_GAP_CLASSNAME} ${getProductGridColumnsClassName(products.length)}`}
        >
          {products.map((product, index) => (
            <div key={product.id} className="w-full max-w-[290px]">
              <ProductCard
                product={product}
                locale={locale}
                newLabel={tProduct('newBadge')}
                addToCartLabel={tProduct('addToCart', { name: product.name })}
                addedToCartLabel={tProduct('addedToCart', { name: product.name })}
                unavailableLabel={tProduct('unavailable', { name: product.name })}
                priority={index < 4}
              />
            </div>
          ))}
        </div>
      ) : !isPending ? (
        <div className="gap-sm py-3xl flex flex-col items-center text-center">
          <EmptyStateCat />
          <p className="text-body-md text-neutral-900">{t('emptyTitle')}</p>
          <p className="text-body-sm text-neutral-500">{t('emptyDescription')}</p>
          {hasActiveFilters && (
            <Button variant="secondary" className="mt-sm" onClick={clearFilters}>
              {t('filters.clear')}
            </Button>
          )}
        </div>
      ) : null}

      {pageCount > 1 && (
        <nav
          aria-label={t('pagination.ariaLabel')}
          className="gap-xs flex items-center justify-center pt-[30px] pb-[20px]"
        >
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => goToPage(Math.max(1, currentPage - 1))}
            aria-label={t('pagination.previous')}
            className={`duration-fast hover:text-paw flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-neutral-700 transition-colors motion-reduce:transition-none ${FOCUS_RING_CLASSNAME} disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:text-neutral-300`}
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
              className={`text-label-md duration-fast flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors motion-reduce:transition-none ${FOCUS_RING_CLASSNAME} ${
                p === currentPage ? 'bg-paw text-surface' : 'hover:text-paw text-neutral-700'
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
            className={`duration-fast hover:text-paw flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-neutral-700 transition-colors motion-reduce:transition-none ${FOCUS_RING_CLASSNAME} disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:text-neutral-300`}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}
