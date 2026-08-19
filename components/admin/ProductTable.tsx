'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '@/components/product/mock-data';
import {
  ADMIN_LOCALE,
  ADMIN_TABLE_CELL_CLASSNAME,
  adminTableRowClassName,
} from '@/components/admin/constants';
import { formatPrice } from '@/lib/utils';
import { iconActionButtonClassName } from '@/components/ui/interaction-styles';
import type { MockProduct } from '@/types';

// MOCK_CATEGORIES не меняется в рантайме — построить Map один раз на модуль, а не искать
// .find() внутри .map() по продуктам на каждый рендер таблицы (был O(n×m) на каждый Toggle-клик).
const CATEGORY_NAME_BY_ID = new Map(
  MOCK_CATEGORIES.map((category) => [category.id, category.nameEn]),
);

function getCategoryName(categoryId: string): string {
  return CATEGORY_NAME_BY_ID.get(categoryId) ?? '—';
}

const CELL_CLASSNAME = ADMIN_TABLE_CELL_CLASSNAME;

export function ProductTable() {
  const [products, setProducts] = useState<MockProduct[]>(MOCK_PRODUCTS);
  const [productToDelete, setProductToDelete] = useState<MockProduct | null>(null);

  function handleToggleActive(id: string, isActive: boolean) {
    setProducts((current) =>
      current.map((product) => (product.id === id ? { ...product, isActive } : product)),
    );
  }

  // CLAUDE.md → «База данных»: soft delete через isActive, не DELETE — тот же переход, что делает
  // Toggle в колонке Active, но с подтверждением. Строка остаётся в таблице (не исчезает), поэтому
  // кнопка-триггер Panel не размонтируется вместе с закрытием — Panel корректно возвращает фокус.
  function handleConfirmDelete() {
    if (!productToDelete) return;
    handleToggleActive(productToDelete.id, false);
    setProductToDelete(null);
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
                    <p className="text-label-md truncate text-neutral-900">{product.name}</p>
                    <p className="text-body-sm truncate text-neutral-500">
                      {getCategoryName(product.categoryId)}
                    </p>
                  </div>
                </div>
                <div className="gap-xs flex shrink-0 items-center">
                  <Link
                    href={`/admin/dashboard/products/${product.id}/edit`}
                    aria-label={`Edit ${product.name}`}
                    className={iconActionButtonClassName()}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setProductToDelete(product)}
                    aria-label={`Delete ${product.name}`}
                    className={iconActionButtonClassName('danger')}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="gap-sm flex items-center">
                  <span className="text-label-md text-neutral-900">
                    {formatPrice(product.price, ADMIN_LOCALE)}
                  </span>
                  {product.isNew && <Badge variant="new">New</Badge>}
                </div>
                <Toggle
                  checked={product.isActive}
                  onChange={(checked) => handleToggleActive(product.id, checked)}
                  aria-label={`${product.isActive ? 'Deactivate' : 'Activate'} ${product.name}`}
                />
              </div>
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
            {/* colSpan-строка, не замена таблицы текстом — заголовок остаётся виден. Недостижимо
                на моках (MOCK_PRODUCTS непустой, и Delete здесь — soft-delete через Toggle, не
                удаляет строку), но handleToggleActive деактивирует, не убирает из products — если
                этот список когда-нибудь станет отфильтрованным (например по категории), пустой
                результат должен быть читаемым, а не голой таблицей без строк. */}
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-md py-3xl text-body-md text-center text-neutral-500">
                  No products yet.
                </td>
              </tr>
            ) : (
              products.map((product, index) => (
                <tr key={product.id} className={adminTableRowClassName(index)}>
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
                  <td className={CELL_CLASSNAME}>{product.name}</td>
                  <td className={CELL_CLASSNAME}>{getCategoryName(product.categoryId)}</td>
                  <td className={CELL_CLASSNAME}>{formatPrice(product.price, ADMIN_LOCALE)}</td>
                  <td className={CELL_CLASSNAME}>
                    {product.isNew && <Badge variant="new">New</Badge>}
                  </td>
                  <td className="px-md py-sm">
                    <Toggle
                      checked={product.isActive}
                      onChange={(checked) => handleToggleActive(product.id, checked)}
                      aria-label={`${product.isActive ? 'Deactivate' : 'Activate'} ${product.name}`}
                    />
                  </td>
                  <td className="px-md py-sm">
                    <div className="gap-xs flex items-center">
                      <Link
                        href={`/admin/dashboard/products/${product.id}/edit`}
                        aria-label={`Edit ${product.name}`}
                        className={iconActionButtonClassName()}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setProductToDelete(product)}
                        aria-label={`Delete ${product.name}`}
                        className={iconActionButtonClassName('danger')}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
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
                `"${productToDelete.name}" will be marked inactive and hidden from the storefront.`}
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
