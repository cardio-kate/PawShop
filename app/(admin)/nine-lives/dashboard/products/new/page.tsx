import { ProductForm } from '@/components/admin/ProductForm';
import { getCategories } from '@/lib/db/queries/products.queries';

// getCategories() — без отдельного action-файла, вызывается напрямую из products.queries.ts
// (architecture.md §3.7): фиксированный справочник, читать его не требует requireAdminSession() —
// эта же функция используется и на публичной витрине (Фаза 5).
export default async function AdminProductNewPage() {
  const categories = await getCategories();

  return (
    <div className="gap-lg p-lg flex flex-col">
      <h1 className="text-h2 text-neutral-900">New product</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
