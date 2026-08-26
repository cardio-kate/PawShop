'use client';

import { Fragment, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import {
  ADMIN_LOCALE,
  ADMIN_TABLE_CELL_CLASSNAME,
  adminTableRowClassName,
} from '@/components/admin/constants';
import { formatPrice } from '@/lib/utils';
import { iconActionButtonClassName } from '@/components/ui/interaction-styles';
import { deleteProduct, getProduct, updateProduct } from '@/actions/products.actions';
import type { AdminProductListItem } from '@/lib/db/queries/products.queries';

interface ProductTableCategory {
  id: number;
  nameEn: string;
}

interface ProductTableProps {
  products: AdminProductListItem[];
  categories: ProductTableCategory[];
}

const CELL_CLASSNAME = ADMIN_TABLE_CELL_CLASSNAME;

export function ProductTable({ products: initialProducts, categories }: ProductTableProps) {
  const [products, setProducts] = useState<AdminProductListItem[]>(initialProducts);
  const [productToDelete, setProductToDelete] = useState<AdminProductListItem | null>(null);
  // Одна карта "в процессе" вместо булева на компонент — несколько строк могут переключаться
  // параллельно (админ кликает Toggle по нескольким товарам подряд, не дожидаясь ответа сервера).
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<Record<number, string>>({});

  // categories не меняется в рантайме (4 фиксированные записи, CLAUDE.md → non-goals: CRUD категорий
  // нет) — карта строится на каждый рендер из пропа, но это O(4), не повод под useMemo.
  const categoryNameById = new Map(categories.map((category) => [category.id, category.nameEn]));
  function getCategoryName(categoryId: number): string {
    return categoryNameById.get(categoryId) ?? '—';
  }

  function setPending(id: number, isPending: boolean) {
    setPendingIds((current) => {
      const next = new Set(current);
      if (isPending) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  function setRowError(id: number, message: string | null) {
    setErrors((current) => {
      if (message === null) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [id]: removed, ...rest } = current;
        return rest;
      }
      return { ...current, [id]: message };
    });
  }

  function updateLocalActive(id: number, isActive: boolean) {
    setProducts((current) =>
      current.map((product) => (product.id === id ? { ...product, isActive } : product)),
    );
  }

  // Деактивация (Toggle → off, Delete-подтверждение) — единственное готовое действие для этого,
  // deleteProduct (ТЗ §5, soft delete: isActive: false, CLAUDE.md → «База данных»). Реактивация
  // (Toggle → on) не имеет отдельного action в ТЗ §5 — план явно запрещает добавлять действия по
  // аналогии без вопроса, поэтому переиспользуется тот же updateProduct, что и ProductForm: полный
  // текущий товар (getProduct) пересохраняется с isActive: true, без нового backend-кода.
  async function setActive(product: AdminProductListItem, isActive: boolean) {
    setPending(product.id, true);
    setRowError(product.id, null);
    updateLocalActive(product.id, isActive);

    if (!isActive) {
      const result = await deleteProduct(product.id);
      setPending(product.id, false);
      if (!result.success) {
        updateLocalActive(product.id, true);
        setRowError(product.id, Object.values(result.errors)[0] ?? 'Failed to save. Please try again.');
      }
      return;
    }

    const detail = await getProduct(product.id);
    if (!detail) {
      updateLocalActive(product.id, false);
      setPending(product.id, false);
      setRowError(product.id, 'Failed to load product. Please try again.');
      return;
    }

    const result = await updateProduct(product.id, {
      categoryId: detail.categoryId,
      nameEn: detail.nameEn,
      nameDe: detail.nameDe,
      descriptionEn: detail.descriptionEn,
      descriptionDe: detail.descriptionDe,
      composition: detail.composition,
      analyticalConstituents: detail.analyticalConstituents,
      flavor: detail.flavor,
      ageGroup: detail.ageGroup,
      images: detail.images,
      isNew: detail.isNew,
      isActive: true,
      variants: detail.variants.map((variant) => ({
        id: variant.id,
        label: variant.label,
        price: variant.price,
        isActive: variant.isActive,
      })),
    });
    setPending(product.id, false);
    if (!result.success) {
      updateLocalActive(product.id, false);
      setRowError(product.id, Object.values(result.errors)[0] ?? 'Failed to save. Please try again.');
    }
  }

  function handleToggleActive(product: AdminProductListItem, isActive: boolean) {
    void setActive(product, isActive);
  }

  // CLAUDE.md → «База данных»: soft delete через isActive, не DELETE — тот же переход, что делает
  // Toggle в колонке Active, но с подтверждением.
  function handleConfirmDelete() {
    if (!productToDelete) return;
    handleToggleActive(productToDelete, false);
    setProductToDelete(null);
  }

  function priceLabel(product: AdminProductListItem): string {
    return product.price !== null ? formatPrice(product.price, ADMIN_LOCALE) : '—';
  }

  return (
    <>
      {/* < sm: 7-колоночная таблица (min-w-[720px]) не помещается на телефоне без горизонтального
          скролла — по прямому запросу карточка на строку вместо этого, тот же брейкпоинт, что у
          DeliveryTable/OrderTable и у переключения AdminSidebar между мобильной панелью и боковой
          колонкой. ≥ sm — обычная таблица без изменений. */}
      <div className="gap-sm flex flex-col sm:hidden">
        {products.length === 0 ? (
          <p className="px-md py-3xl text-body-md text-center text-neutral-500">No products yet.</p>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="gap-sm rounded-md border border-neutral-300 p-md flex flex-col"
            >
              <div className="gap-sm flex items-start justify-between">
                <div className="gap-sm flex min-w-0 items-center">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm bg-neutral-100">
                    <Image
                      src={product.images[0]!}
                      alt=""
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-label-md truncate text-neutral-900">{product.nameEn}</p>
                    <p className="text-body-sm truncate text-neutral-500">
                      {getCategoryName(product.categoryId)}
                    </p>
                  </div>
                </div>
                <div className="gap-xs flex shrink-0 items-center">
                  <Link
                    href={`/nine-lives/dashboard/products/${product.id}/edit`}
                    aria-label={`Edit ${product.nameEn}`}
                    className={iconActionButtonClassName()}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setProductToDelete(product)}
                    aria-label={`Delete ${product.nameEn}`}
                    className={iconActionButtonClassName('danger')}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="gap-sm flex items-center">
                  <span className="text-label-md text-neutral-900">{priceLabel(product)}</span>
                  {product.isNew && <Badge variant="new">New</Badge>}
                </div>
                <Toggle
                  checked={product.isActive}
                  onChange={(checked) => handleToggleActive(product, checked)}
                  disabled={pendingIds.has(product.id)}
                  aria-label={`${product.isActive ? 'Deactivate' : 'Activate'} ${product.nameEn}`}
                />
              </div>
              {errors[product.id] && (
                <span role="alert" className="text-body-sm text-error">
                  {errors[product.id]}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-md border border-neutral-300 sm:block">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-neutral-300">
              <th scope="col" className="px-md py-sm w-16">
                <span className="sr-only">Photo</span>
              </th>
              <th scope="col" className={`${CELL_CLASSNAME} text-label-md`}>
                Name
              </th>
              <th scope="col" className={`${CELL_CLASSNAME} text-label-md`}>
                Category
              </th>
              <th scope="col" className={`${CELL_CLASSNAME} text-label-md`}>
                Price
              </th>
              <th scope="col" className={`${CELL_CLASSNAME} text-label-md`}>
                Status
              </th>
              <th scope="col" className={`${CELL_CLASSNAME} text-label-md`}>
                Active
              </th>
              <th scope="col" className="px-md py-sm">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* colSpan-строка, не замена таблицы текстом — заголовок остаётся виден. Реально
                достижимо теперь на пустой БД (getAdminProducts() без товаров). */}
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-md py-3xl text-body-md text-center text-neutral-500">
                  No products yet.
                </td>
              </tr>
            ) : (
              products.map((product, index) => (
                <Fragment key={product.id}>
                  <tr className={adminTableRowClassName(index)}>
                    <td className="px-md py-sm">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm bg-neutral-100">
                        <Image
                          src={product.images[0]!}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                    </td>
                    <td className={CELL_CLASSNAME}>{product.nameEn}</td>
                    <td className={CELL_CLASSNAME}>{getCategoryName(product.categoryId)}</td>
                    <td className={CELL_CLASSNAME}>{priceLabel(product)}</td>
                    <td className={CELL_CLASSNAME}>
                      {product.isNew && <Badge variant="new">New</Badge>}
                    </td>
                    <td className="px-md py-sm">
                      <Toggle
                        checked={product.isActive}
                        onChange={(checked) => handleToggleActive(product, checked)}
                        disabled={pendingIds.has(product.id)}
                        aria-label={`${product.isActive ? 'Deactivate' : 'Activate'} ${product.nameEn}`}
                      />
                    </td>
                    <td className="px-md py-sm">
                      <div className="gap-xs flex items-center">
                        <Link
                          href={`/nine-lives/dashboard/products/${product.id}/edit`}
                          aria-label={`Edit ${product.nameEn}`}
                          className={iconActionButtonClassName()}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setProductToDelete(product)}
                          aria-label={`Delete ${product.nameEn}`}
                          className={iconActionButtonClassName('danger')}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {errors[product.id] && (
                    <tr className="border-b border-neutral-300">
                      <td colSpan={7} className={`${CELL_CLASSNAME} pt-0`}>
                        <span role="alert" className="text-body-sm text-error">
                          {errors[product.id]}
                        </span>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* §10 ТЗ: удаление товара — с подтверждением. Тот же Panel, что и корзина (design.md →
          «Модальные окна admin используют тот же компонент panel, что и корзина»), не отдельная
          центрированная модалка. Общий и для карточек, и для таблицы — рендерится один раз. */}
      <Panel
        open={productToDelete !== null}
        onClose={() => setProductToDelete(null)}
        ariaLabel="Delete product"
        closeLabel="Close"
      >
        <div className="gap-lg p-lg pt-3xl flex flex-col">
          <div className="gap-sm flex flex-col">
            <h2 className="text-h3 text-neutral-900">Delete product?</h2>
            <p className="text-body-sm text-neutral-500">
              {productToDelete &&
                `"${productToDelete.nameEn}" will be marked inactive and hidden from the storefront.`}
            </p>
          </div>
          <div className="gap-sm flex flex-col">
            <Button variant="primary" onClick={handleConfirmDelete} className="w-full">
              Delete
            </Button>
            <Button variant="secondary" onClick={() => setProductToDelete(null)} className="w-full">
              Cancel
            </Button>
          </div>
        </div>
      </Panel>
    </>
  );
}
