import { ProductForm } from '@/components/admin/ProductForm';

export default function AdminProductNewPage() {
  return (
    <div className="flex flex-col gap-lg p-lg">
      <h1 className="text-h2 text-neutral-900">New product</h1>
      <ProductForm />
    </div>
  );
}
