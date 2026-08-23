import { ProductForm } from '@/components/admin/ProductForm';

export default function AdminProductNewPage() {
  return (
    <div className="gap-lg p-lg flex flex-col">
      <h1 className="text-h2 text-neutral-900">New product</h1>
      <ProductForm />
    </div>
  );
}
