import { Button } from '@/components/ui/Button';
import { ProductTable } from '@/components/admin/ProductTable';

export default function AdminProductsPage() {
  return (
    <div className="flex flex-col gap-lg p-lg">
      <div className="flex items-center justify-between gap-md">
        <h1 className="text-h2 text-neutral-900">Products</h1>
        <Button href="/admin/dashboard/products/new" variant="primary" size="sm">
          + Add product
        </Button>
      </div>
      <ProductTable />
    </div>
  );
}
