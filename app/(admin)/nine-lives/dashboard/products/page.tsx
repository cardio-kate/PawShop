import { Button } from '@/components/ui/Button';
import { ProductTable } from '@/components/admin/ProductTable';

export default function AdminProductsPage() {
  return (
    <div className="gap-lg p-lg flex flex-col">
      <div className="gap-md flex items-center justify-between">
        <h1 className="text-h2 text-neutral-900">Products</h1>
        <Button href="/nine-lives/dashboard/products/new" variant="primary" size="sm">
          + Add product
        </Button>
      </div>
      <ProductTable />
    </div>
  );
}
