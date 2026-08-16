import { ProductTable } from '@/components/admin/ProductTable';

export default function AdminProductsPage() {
  return (
    <div className="flex flex-col gap-lg p-lg">
      <h1 className="text-h2 text-neutral-900">Products</h1>
      <ProductTable />
    </div>
  );
}
