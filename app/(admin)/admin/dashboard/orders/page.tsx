import { OrderTable } from '@/components/admin/OrderTable';

export default function AdminOrdersPage() {
  return (
    <div className="flex flex-col gap-lg p-lg">
      <h1 className="text-h2 text-neutral-900">Orders</h1>
      <OrderTable />
    </div>
  );
}
