import { OrderTable } from '@/components/admin/OrderTable';
import { getOrders } from '@/actions/orders.actions';

// Без панели фильтров/пагинации — план Фазы 5 не заводит для неё UI-контракт (ProductTable в той же
// фазе тоже без пагинации). limit 100 — с запасом покрывает реальный масштаб нишевого магазина, не
// дефолтный CATALOG_PAGE_SIZE=8, который молча спрятал бы старые заказы из списка.
export default async function AdminOrdersPage() {
  const { orders } = await getOrders({ limit: 100 });

  return (
    <div className="gap-lg p-lg flex flex-col">
      <h1 className="text-h2 text-neutral-900">Orders</h1>
      <OrderTable orders={orders} />
    </div>
  );
}
