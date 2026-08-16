import Link from 'next/link';
import { ProductTable } from '@/components/admin/ProductTable';

// Button (components/ui/Button.tsx) всегда рендерит <button> и не принимает children-как-триггер
// навигации (нет asChild/полиморфизма) — вложенный <Link> дал бы невалидный <button><a> в DOM.
// Классы продублированы из Button variant="primary" size="sm" вместо расширения примитива ради
// одного места использования.
const ADD_PRODUCT_LINK_CLASSNAME =
  'inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-full border border-transparent bg-paw px-[28px] py-[7px] text-label-md text-surface transition-colors duration-fast hover:bg-paw-hover active:bg-paw-active motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw';

export default function AdminProductsPage() {
  return (
    <div className="flex flex-col gap-lg p-lg">
      <div className="flex items-center justify-between gap-md">
        <h1 className="text-h2 text-neutral-900">Products</h1>
        <Link href="/admin/dashboard/products/new" className={ADD_PRODUCT_LINK_CLASSNAME}>
          + Add product
        </Link>
      </div>
      <ProductTable />
    </div>
  );
}
