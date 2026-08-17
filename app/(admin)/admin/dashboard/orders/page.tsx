import { OrderTable } from '@/components/admin/OrderTable';

export default function AdminOrdersPage() {
  return (
    <div className="gap-lg p-lg flex flex-col">
      <h1 className="text-h2 text-neutral-900">Orders</h1>
      <OrderTable />
    </div>
  );
}
