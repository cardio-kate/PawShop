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
import { getMockOrderSubtotal } from '@/components/admin/mock-data';
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
  const subtotal = getMockOrderSubtotal(order);
  const total = subtotal + order.shippingPriceAtOrder;

  return (
    <div className="gap-lg grid grid-cols-1 lg:grid-cols-[1fr_340px]">
      <div className="gap-md flex flex-col">
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
                    <span className="text-body-sm block text-neutral-500">
                      {item.variantLabelAtOrder}
                    </span>
                  </td>
                  <td className={CELL_CLASSNAME}>{item.quantity}</td>
                  <td className={CELL_CLASSNAME}>{formatPrice(item.priceAtOrder, ADMIN_LOCALE)}</td>
                  <td className={CELL_CLASSNAME}>
                    {formatPrice(item.priceAtOrder * item.quantity, ADMIN_LOCALE)}
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
            <div
              className={`relative inline-flex items-center rounded-full ${orderStatusColorClassName(status)}`}
            >
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                aria-label="Order status"
                className={`text-label-caps appearance-none bg-transparent py-1.5 pr-8 pl-3 font-semibold text-current outline-none ${FOCUS_RING_CLASSNAME}`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-current"
              />
            </div>
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
            {order.countryName}
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
