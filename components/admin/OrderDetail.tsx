'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  ADMIN_LOCALE,
  ADMIN_TABLE_CELL_CLASSNAME,
  ORDER_DATETIME_FORMATTER,
  ORDER_STATUS_LABEL,
  adminTableRowClassName,
  orderStatusColorClassName,
} from '@/components/admin/constants';
import { getMockOrderTotal } from '@/components/admin/mock-data';
import { FOCUS_RING_CLASSNAME } from '@/components/ui/interaction-styles';
import { formatPrice } from '@/lib/utils';
import type { MockOrder, OrderStatus } from '@/types';

const STATUSES: OrderStatus[] = ['new', 'processing', 'done', 'cancelled'];

const CELL_CLASSNAME = ADMIN_TABLE_CELL_CLASSNAME;

interface OrderDetailProps {
  order: MockOrder;
}

// design.md → «Order detail»: две колонки — слева позиции заказа (admin table, не cart-item: снапшот
// без фото и без степпера количества), справа контакты/адрес/доставка/comment/статус.
// updateOrderStatus не подключён (Фаза 7 — UI на моках) — смена статуса живёт в локальном useState,
// как toggle в ProductTable.
export function OrderDetail({ order }: OrderDetailProps) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const subtotal = order.items.reduce((sum, item) => sum + item.priceAtOrder * item.quantity, 0);
  const total = getMockOrderTotal(order);

  return (
    <div className="grid grid-cols-1 gap-lg lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-md">
        <h2 className="text-h3 text-neutral-900">Items</h2>
        <div className="overflow-x-auto rounded-md border border-neutral-300">
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
                    <span className="block text-body-sm text-neutral-500">{item.variantLabelAtOrder}</span>
                  </td>
                  <td className={CELL_CLASSNAME}>{item.quantity}</td>
                  <td className={CELL_CLASSNAME}>{formatPrice(item.priceAtOrder, ADMIN_LOCALE)}</td>
                  <td className={CELL_CLASSNAME}>{formatPrice(item.priceAtOrder * item.quantity, ADMIN_LOCALE)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex w-full flex-col gap-xs text-body-sm text-neutral-700 sm:w-64 sm:self-end">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal, ADMIN_LOCALE)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Shipping</span>
            <span>{formatPrice(order.shippingPriceAtOrder, ADMIN_LOCALE)}</span>
          </div>
          <div className="flex items-center justify-between text-label-md text-neutral-900">
            <span>Total</span>
            <span>{formatPrice(total, ADMIN_LOCALE)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-lg">
        <div className="flex flex-col gap-sm">
          <div className="flex items-center justify-between gap-md">
            <h2 className="text-h3 text-neutral-900">Customer</h2>
            <div className={`relative inline-flex items-center rounded-full ${orderStatusColorClassName(status)}`}>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                aria-label="Order status"
                className={`appearance-none bg-transparent py-1.5 pl-3 pr-8 text-label-caps font-semibold text-current outline-none ${FOCUS_RING_CLASSNAME}`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-current"
              />
            </div>
          </div>
          <p className="text-body-sm text-neutral-500">Order #{order.id} · {ORDER_DATETIME_FORMATTER.format(new Date(order.createdAt))}</p>
          <p className="text-body-sm text-neutral-900">{order.customerName}</p>
          <p className="text-body-sm text-neutral-900">{order.phone}</p>
        </div>

        <div className="flex flex-col gap-sm">
          <h2 className="text-h3 text-neutral-900">Delivery address</h2>
          <p className="text-body-sm text-neutral-900">
            {order.street}
            <br />
            {order.city}, {order.postalCode}
            <br />
            {order.countryName}
          </p>
        </div>

        <div className="flex flex-col gap-sm">
          <h2 className="text-h3 text-neutral-900">Comment</h2>
          <p className="text-body-sm text-neutral-500">{order.comment ?? 'No comment'}</p>
        </div>
      </div>
    </div>
  );
}
