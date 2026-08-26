import { Button } from '@/components/ui/Button';
import { ProductTable } from '@/components/admin/ProductTable';
import { getAdminProducts } from '@/actions/products.actions';
import { getCategories } from '@/lib/db/queries/products.queries';

// Без панели фильтров/пагинации — план Фазы 5 не заводит для неё UI-контракт (см. тот же выбор в
// orders/page.tsx). limit 100 — с запасом покрывает реальный масштаб нишевого магазина.
export default async function AdminProductsPage() {
  const [{ products }, categories] = await Promise.all([
    getAdminProducts({ limit: 100 }),
    getCategories(),
  ]);

  return (
    <div className="gap-lg p-lg flex flex-col">
      <div className="gap-md flex items-center justify-between">
        <h1 className="text-h2 text-neutral-900">Products</h1>
        <Button href="/nine-lives/dashboard/products/new" variant="primary" size="sm">
          + Add product
        </Button>
      </div>
      <ProductTable products={products} categories={categories} />
    </div>
  );
}
