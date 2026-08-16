import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { MOCK_ORDERS, getMockOrderTotal } from '@/components/admin/mock-data';
import { ADMIN_LOCALE, ADMIN_TABLE_CELL_CLASSNAME, ORDER_DATE_FORMATTER, ORDER_STATUS_LABEL } from '@/components/admin/constants';
import { formatPrice } from '@/lib/utils';
import type { OrderStatus } from '@/types';

const STATUS_BADGE_VARIANT: Record<OrderStatus, 'order-new' | 'order-processing' | 'order-done' | 'order-cancelled'> = {
  new: 'order-new',
  processing: 'order-processing',
  done: 'order-done',
  cancelled: 'order-cancelled',
};

const CELL_CLASSNAME = ADMIN_TABLE_CELL_CLASSNAME;

// design.md → Admin table: тот же паттерн (table-row-even/odd, table-border), что и в ProductTable —
// список без интерактивных мутаций (в отличие от ProductTable), поэтому Server Component, без
// 'use client'. Переход к деталям — через ссылку в последней колонке, не JS onClick на строке.
export function OrderTable() {
  return (
    <div className="overflow-x-auto rounded-md border border-neutral-300">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-neutral-300">
            <th scope="col" className={`${CELL_CLASSNAME} text-label-md`}>
              Order
            </th>
            <th scope="col" className={`${CELL_CLASSNAME} text-label-md`}>
              Customer
            </th>
            <th scope="col" className={`${CELL_CLASSNAME} text-label-md`}>
              Date
            </th>
            <th scope="col" className={`${CELL_CLASSNAME} text-label-md`}>
              Total
            </th>
            <th scope="col" className={`${CELL_CLASSNAME} text-label-md`}>
              Status
            </th>
            <th scope="col" className="px-md py-sm">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {MOCK_ORDERS.map((order, index) => (
            <tr key={order.id} className={`border-b border-neutral-300 last:border-b-0 ${index % 2 === 0 ? 'bg-neutral-100' : 'bg-surface'}`}>
              <td className={CELL_CLASSNAME}>#{order.id}</td>
              <td className={CELL_CLASSNAME}>{order.customerName}</td>
              <td className={CELL_CLASSNAME}>{ORDER_DATE_FORMATTER.format(new Date(order.createdAt))}</td>
              <td className={CELL_CLASSNAME}>{formatPrice(getMockOrderTotal(order), ADMIN_LOCALE)}</td>
              <td className="px-md py-sm">
                <Badge variant={STATUS_BADGE_VARIANT[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
              </td>
              <td className="px-md py-sm">
                <Link
                  href={`/admin/dashboard/orders/${order.id}`}
                  aria-label={`View order #${order.id}`}
                  className="flex cursor-pointer items-center justify-center rounded-full p-1 text-neutral-700 transition-colors duration-fast hover:text-paw motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
