import { OrderTable } from '@/components/admin/OrderTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { getOrders } from '@/actions/orders.actions';
import { ADMIN_PAGE_SIZE } from '@/lib/constants';
import { parseAdminPage, redirectIfPageOutOfRange } from '@/lib/admin-pagination';

const BASE_PATH = '/nine-lives/dashboard/orders';

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parseAdminPage(pageParam);
  const { orders, total } = await getOrders({
    limit: ADMIN_PAGE_SIZE,
    offset: (page - 1) * ADMIN_PAGE_SIZE,
  });
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  redirectIfPageOutOfRange(page, pageCount, BASE_PATH);

  return (
    <div className="gap-lg p-lg flex flex-col">
      <h1 className="text-h2 text-neutral-900">Orders</h1>
      <OrderTable orders={orders} />
      <AdminPagination page={page} pageCount={pageCount} basePath={BASE_PATH} />
    </div>
  );
}
