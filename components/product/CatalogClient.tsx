'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyStateCat } from '@/components/ui/EmptyStateCat';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ProductCard } from '@/components/product/ProductCard';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '@/components/product/mock-data';
import { getProductGridColumnsClassName } from '@/components/product/getProductGridColumnsClassName';
import { PRODUCT_CARD_GRID_GAP_CLASSNAME } from '@/components/product/product-grid-styles';
import { FOCUS_RING_CLASSNAME } from '@/components/ui/interaction-styles';
import { useSyncedValue } from '@/lib/hooks/useSyncedValue';
import type { AgeGroup } from '@/types';

const AGE_GROUPS: AgeGroup[] = ['kitten', 'adult', 'senior'];
// design.md → Layout «Пагинация»: 8 товаров на страницу (2 полных ряда по 4 колонки на десктопе),
// то же значение зафиксировано и в architecture.md как дефолт limit для будущего getProducts().
const PAGE_SIZE = 8;

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="gap-sm flex flex-col sm:flex-row sm:items-center">
      <span className="text-label-md text-neutral-900 sm:w-28 sm:shrink-0">{label}</span>
      <div className="gap-sm flex flex-wrap items-center">{children}</div>
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

  // Любое изменение условия фильтрации — поиска (приходит снаружи, Header → router.push
  // ('/catalog?search=...')) или category/age/price (наши же обработчики ниже) — сбрасывает
  // страницу на 1, а не оставляет пользователя на, например, третьей странице пустого результата.
  // Раньше setPage(1) был продублирован в каждом обработчике по отдельности (риск забыть при
  // добавлении шестого фильтра) — теперь один общий хук (useSyncedValue, тот же приём, что и в
  // Header.tsx для своей синхронизации с ?search=) сравнивает составной ключ всех условий во время
  // рендера и сбрасывает страницу ровно один раз на каждое реальное изменение, без лишнего кадра
  // со старой страницей, который дал бы useEffect.
  const filtersKey = JSON.stringify([
    search,
    selectedCategories,
    selectedAgeGroups,
    minPrice,
    maxPrice,
  ]);
  useSyncedValue(filtersKey, () => setPage(1));

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  function toggleAgeGroup(age: AgeGroup) {
    setSelectedAgeGroups((prev) =>
      prev.includes(age) ? prev.filter((a) => a !== age) : [...prev, age],
    );
  }

  function handleMinPriceChange(value: string) {
    setMinPrice(value);
  }

  function handleMaxPriceChange(value: string) {
    setMaxPrice(value);
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const min = minPrice === '' ? null : Number(minPrice);
    const max = maxPrice === '' ? null : Number(maxPrice);

    return MOCK_PRODUCTS.filter((product) => {
      if (query && !product.name.toLowerCase().includes(query)) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(product.categoryId))
        return false;
      if (selectedAgeGroups.length > 0 && !selectedAgeGroups.includes(product.ageGroup))
        return false;
      if (min !== null && !Number.isNaN(min) && product.price < min) return false;
      if (max !== null && !Number.isNaN(max) && product.price > max) return false;
      return true;
    });
  }, [search, selectedCategories, selectedAgeGroups, minPrice, maxPrice]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedAgeGroups.length > 0 ||
    minPrice !== '' ||
    maxPrice !== '' ||
    search !== '';

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
    <div className="gap-lg flex flex-col">
      <div className="gap-md pb-lg flex flex-col border-b border-neutral-200">
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
          {/* w-20 на обёртке, не на Input — TEXT_FIELD_BASE_CLASSNAME несёт w-full, и в
              скомпилированном Tailwind-CSS правило .w-full идёт после .w-20, так что при
              одинаковой специфичности побеждает w-full независимо от порядка классов в JSX.
              Фиксированная ширина обёртки даёт w-full внутри посчитаться от неё. */}
          <div className="w-20">
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              value={minPrice}
              onChange={(e) => handleMinPriceChange(e.target.value)}
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
              onChange={(e) => handleMaxPriceChange(e.target.value)}
              placeholder={t('filters.priceTo')}
              aria-label={t('filters.priceTo')}
              compact
            />
          </div>
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
        // PRODUCT_CARD_GRID_GAP_CLASSNAME (30px), не gap-gutter (24px, design.md → Layout
        // «Сетка каталога») — по прямому запросу, единое значение для всех сеток карточек товара
        // на сайте (components/product/product-grid-styles.ts). Колонки — minmax(0, 290px), не
        // фикс. ширина ряда (в отличие от New Arrivals), поэтому увеличение gap не требует
        // пересчёта контейнера — грид просто шире раздвигает карточки внутри max-w-container.
        <div
          className={`grid justify-center justify-items-center ${PRODUCT_CARD_GRID_GAP_CLASSNAME} ${getProductGridColumnsClassName(pageItems.length)}`}
        >
          {pageItems.map((product, index) => (
            <div key={product.id} className="w-full max-w-[290px]">
              <ProductCard
                product={product}
                locale={locale}
                newLabel={tProduct('newBadge')}
                addToCartLabel={tProduct('addToCart', { name: product.name })}
                addedToCartLabel={tProduct('addedToCart', { name: product.name })}
                unavailableLabel={tProduct('unavailable', { name: product.name })}
                // CLAUDE.md → «Загрузка изображений»: первые 2–4 карточки каталога — в первом
                // экране, остальные — обычный lazy (next/image по умолчанию).
                priority={index < 4}
              />
            </div>
          ))}
        </div>
      ) : (
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
      )}

      {pageCount > 1 && (
        // pt-[30px]/pb-[20px], не pt-md (16px) — по прямому запросу, не токен spacing-шкалы
        // (ближайшие — lg/24px и md/16px, оба не совпадают ни с одним из двух значений).
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
