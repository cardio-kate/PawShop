import { Button } from '@/components/ui/Button';
import { ProductTable } from '@/components/admin/ProductTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { getAdminProducts } from '@/actions/products.actions';
import { getCategories } from '@/lib/db/queries/products.queries';
import { ADMIN_PAGE_SIZE } from '@/lib/constants';
import { parseAdminPage, redirectIfPageOutOfRange } from '@/lib/admin-pagination';

const BASE_PATH = '/nine-lives/dashboard/products';

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parseAdminPage(pageParam);
  const [{ products, total }, categories] = await Promise.all([
    getAdminProducts({ limit: ADMIN_PAGE_SIZE, offset: (page - 1) * ADMIN_PAGE_SIZE }),
    getCategories(),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  redirectIfPageOutOfRange(page, pageCount, BASE_PATH);

  return (
    <div className="gap-lg p-lg flex flex-col">
      <div className="gap-md flex items-center justify-between">
        <h1 className="text-h2 text-neutral-900">Products</h1>
        <Button href="/nine-lives/dashboard/products/new" variant="primary" size="sm">
          + Add product
        </Button>
      </div>
      {/* key={page} — ProductTable клиентский и держит products/pendingIds/errors в useState;
          без key React не пересоздаёт стейт при смене страницы через <Link>, таблица оставалась
          на данных предыдущей страницы, хотя URL и AdminPagination уже показывали новую. */}
      <ProductTable key={page} products={products} categories={categories} />
      <AdminPagination page={page} pageCount={pageCount} basePath={BASE_PATH} />
    </div>
  );
}
