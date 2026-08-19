import { DeliveryTable } from '@/components/admin/DeliveryTable';

export default function AdminDeliveryPage() {
  return (
    <div className="gap-lg p-lg flex flex-col">
      <h1 className="text-h2 text-neutral-900">Delivery</h1>
      <DeliveryTable />
    </div>
  );
}
