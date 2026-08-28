import { OrderStatusControl } from '@/components/admin/OrderStatusControl';
import {
  ADMIN_LOCALE,
  ADMIN_TABLE_CELL_CLASSNAME,
  ORDER_DATETIME_FORMATTER,
  adminTableRowClassName,
} from '@/components/admin/constants';
import { add, multiplyByQuantity, sum } from '@/lib/money';
import { formatPrice } from '@/lib/utils';
import type { OrderDetail as OrderDetailData } from '@/lib/db/queries/orders.queries';

const CELL_CLASSNAME = ADMIN_TABLE_CELL_CLASSNAME;

interface OrderDetailProps {
  order: OrderDetailData;
}

// design.md → «Order detail»: две колонки — слева позиции заказа (admin table, не cart-item: снапшот
// без фото и без степпера количества), справа контакты/адрес/доставка/comment/статус. Смена статуса —
// OrderStatusControl (client), подключён к updateOrderStatus (готов с Фазы 4, оставался неподключённым
// как осознанный долг Фазы 5). OrderTable в списке по-прежнему read-only Badge — там смена статуса не
// нужна, деталь заказа открывается отдельным переходом.
export function OrderDetail({ order }: OrderDetailProps) {
  const subtotal = sum(order.items.map((item) => multiplyByQuantity(item.priceAtOrder, item.quantity)));
  const total = add(subtotal, order.shippingPriceAtOrder);

  return (
    <div className="gap-lg grid grid-cols-1 lg:grid-cols-[1fr_340px]">
      <div className="gap-md flex flex-col">
        <h2 className="text-h3 text-neutral-900">Items</h2>

        {/* < sm: 4-колоночная таблица (min-w-[480px]) не помещается на телефоне без
            горизонтального скролла — по прямому запросу карточка на позицию вместо этого, тот же
            приём и брейкпоинт, что у ProductTable/OrderTable/DeliveryTable/VariantEditor. ≥ sm —
            обычная таблица без изменений. */}
        <div className="gap-sm flex flex-col sm:hidden">
          {order.items.map((item) => (
            <div key={item.id} className="gap-xs rounded-md border border-neutral-300 p-sm flex flex-col">
              <div>
                <p className="text-body-sm text-neutral-900">{item.productNameAtOrder}</p>
                <p className="text-body-sm text-neutral-500">{item.variantLabelAtOrder}</p>
              </div>
              <div className="text-body-sm flex items-center justify-between text-neutral-700">
                <span>
                  {item.quantity} × {formatPrice(item.priceAtOrder, ADMIN_LOCALE)}
                </span>
                <span className="text-neutral-900">
                  {formatPrice(multiplyByQuantity(item.priceAtOrder, item.quantity), ADMIN_LOCALE)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto rounded-md border border-neutral-300 sm:block">
          <table className="w-full min-w-[480px] border-collapse text-left">
            <thead>
              <tr className="border-b border-neutral-300">
                <th scope="col" className={`${CELL_CLASSNAME} text-label-md`}>
                  Product
                </th>
                <th scope="col" className={`${CELL_CLASSNAME} text-label-md`}>
                  Qty
                </th>
                <th scope="col" className={`${CELL_CLASSNAME} text-label-md`}>
                  Price
                </th>
                <th scope="col" className={`${CELL_CLASSNAME} text-label-md`}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={item.id} className={adminTableRowClassName(index)}>
                  <td className={CELL_CLASSNAME}>
                    {item.productNameAtOrder}
                    <span className="text-body-sm block text-neutral-500">
                      {item.variantLabelAtOrder}
                    </span>
                  </td>
                  <td className={CELL_CLASSNAME}>{item.quantity}</td>
                  <td className={CELL_CLASSNAME}>{formatPrice(item.priceAtOrder, ADMIN_LOCALE)}</td>
                  <td className={CELL_CLASSNAME}>
                    {formatPrice(multiplyByQuantity(item.priceAtOrder, item.quantity), ADMIN_LOCALE)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="gap-xs text-body-sm flex w-full flex-col text-neutral-700 sm:w-64 sm:self-end">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal, ADMIN_LOCALE)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Shipping</span>
            <span>{formatPrice(order.shippingPriceAtOrder, ADMIN_LOCALE)}</span>
          </div>
          <div className="text-label-md flex items-center justify-between text-neutral-900">
            <span>Total</span>
            <span>{formatPrice(total, ADMIN_LOCALE)}</span>
          </div>
        </div>
      </div>

      <div className="gap-lg flex flex-col">
        <div className="gap-sm flex flex-col">
          <div className="gap-md flex items-center justify-between">
            <h2 className="text-h3 text-neutral-900">Customer</h2>
            <OrderStatusControl orderId={order.id} status={order.status} />
          </div>
          <p className="text-body-sm text-neutral-500">
            Order #{order.id} · {ORDER_DATETIME_FORMATTER.format(new Date(order.createdAt))}
          </p>
          <p className="text-body-sm text-neutral-900">{order.customerName}</p>
          <p className="text-body-sm text-neutral-900">{order.phone}</p>
        </div>

        <div className="gap-sm flex flex-col">
          <h2 className="text-h3 text-neutral-900">Delivery address</h2>
          <p className="text-body-sm text-neutral-900">
            {order.street}
            <br />
            {order.city}, {order.postalCode}
            <br />
            {order.countryName ?? '—'}
          </p>
        </div>

        <div className="gap-sm flex flex-col">
          <h2 className="text-h3 text-neutral-900">Comment</h2>
          <p className="text-body-sm text-neutral-500">{order.comment ?? 'No comment'}</p>
        </div>
      </div>
    </div>
  );
}
