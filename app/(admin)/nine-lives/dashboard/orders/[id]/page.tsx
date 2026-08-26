import { notFound } from 'next/navigation';
import { OrderDetail } from '@/components/admin/OrderDetail';
import { getOrder } from '@/actions/orders.actions';

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderId = Number(id);
  const order = Number.isInteger(orderId) ? await getOrder(orderId) : null;
  if (!order) notFound();

  return (
    <div className="gap-lg p-lg flex flex-col">
      <h1 className="text-h2 text-neutral-900">Order #{order.id}</h1>
      <OrderDetail order={order} />
    </div>
  );
}
