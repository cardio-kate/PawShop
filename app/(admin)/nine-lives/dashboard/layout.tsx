import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { getNewOrdersCount } from '@/actions/orders.actions';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const newOrdersCount = await getNewOrdersCount();

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <AdminSidebar newOrdersCount={newOrdersCount} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
