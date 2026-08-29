import { ContactMessageTable } from '@/components/admin/ContactMessageTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { getAdminContactMessages } from '@/actions/contact.actions';
import { ADMIN_PAGE_SIZE } from '@/lib/constants';
import { parseAdminPage, redirectIfPageOutOfRange } from '@/lib/admin-pagination';

const BASE_PATH = '/nine-lives/dashboard/messages';

// Тот же паттерн, что orders/page.tsx — единственное отличие: только чтение, без detail-страницы
// (решение от 2026-08-29, .claude/plans/backend-realization-pawshop.md → Фаза 7 STATUS).
export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parseAdminPage(pageParam);
  const { messages, total } = await getAdminContactMessages({
    limit: ADMIN_PAGE_SIZE,
    offset: (page - 1) * ADMIN_PAGE_SIZE,
  });
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  redirectIfPageOutOfRange(page, pageCount, BASE_PATH);

  return (
    <div className="gap-lg p-lg flex flex-col">
      <h1 className="text-h2 text-neutral-900">Messages</h1>
      <ContactMessageTable messages={messages} />
      <AdminPagination page={page} pageCount={pageCount} basePath={BASE_PATH} />
    </div>
  );
}
