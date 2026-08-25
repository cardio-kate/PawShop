import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { getProduct } from '@/actions/products.actions';
import { getCategories } from '@/lib/db/queries/products.queries';

// id в URL — всегда строка, реальный Product.id — serial (number); NaN (не число в адресной
// строке) идёт в notFound() тем же путём, что и несуществующий id, а не падает 500-й Drizzle-
// ошибкой на невалидном запросе.
export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();

  const [product, categories] = await Promise.all([getProduct(productId), getCategories()]);
  if (!product) notFound();

  return (
    <div className="gap-lg p-lg flex flex-col">
      <h1 className="text-h2 text-neutral-900">Edit product</h1>
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
