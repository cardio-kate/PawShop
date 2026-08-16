import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <AdminSidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
