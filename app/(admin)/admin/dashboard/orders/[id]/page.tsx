import { notFound } from 'next/navigation';
import { OrderDetail } from '@/components/admin/OrderDetail';
import { MOCK_ORDERS } from '@/components/admin/mock-data';

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = MOCK_ORDERS.find((o) => o.id === id);
  if (!order) notFound();

  return (
    <div className="gap-lg p-lg flex flex-col">
      <h1 className="text-h2 text-neutral-900">Order #{order.id}</h1>
      <OrderDetail order={order} />
    </div>
  );
}
