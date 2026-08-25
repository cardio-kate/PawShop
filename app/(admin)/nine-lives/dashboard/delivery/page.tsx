import { DeliveryTable } from '@/components/admin/DeliveryTable';
import { getAdminDeliveryCountries } from '@/actions/delivery.actions';

export default async function AdminDeliveryPage() {
  const countries = await getAdminDeliveryCountries();

  return (
    <div className="gap-lg p-lg flex flex-col">
      <h1 className="text-h2 text-neutral-900">Delivery</h1>
      <DeliveryTable countries={countries} />
    </div>
  );
}
