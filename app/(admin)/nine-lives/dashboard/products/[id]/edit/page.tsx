import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { MOCK_PRODUCTS } from '@/components/product/mock-data';

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = MOCK_PRODUCTS.find((p) => p.id === id);
  if (!product) notFound();

  return (
    <div className="gap-lg p-lg flex flex-col">
      <h1 className="text-h2 text-neutral-900">Edit product</h1>
      <ProductForm product={product} />
    </div>
  );
}
