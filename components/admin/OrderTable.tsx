import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import {
  ADMIN_LOCALE,
  ADMIN_TABLE_CELL_CLASSNAME,
  ORDER_DATE_FORMATTER,
  ORDER_STATUS_BADGE_VARIANT,
  ORDER_STATUS_LABEL,
  adminTableRowClassName,
} from '@/components/admin/constants';
import { FOCUS_RING_CLASSNAME, iconActionButtonClassName } from '@/components/ui/interaction-styles';
import { formatPrice } from '@/lib/utils';
import type { OrderListItem } from '@/lib/db/queries/orders.queries';

const CELL_CLASSNAME = ADMIN_TABLE_CELL_CLASSNAME;

interface OrderTableProps {
  orders: OrderListItem[];
}

// design.md → Admin table: тот же паттерн (table-row-even/odd, table-border), что и в ProductTable —
// список без интерактивных мутаций (в отличие от ProductTable), поэтому Server Component, без
// 'use client'. Переход к деталям — через ссылку в последней колонке, не JS onClick на строке.
// orders — getOrders() из actions/orders.actions.ts, вызывается страницей (Server Component).
export function OrderTable({ orders }: OrderTableProps) {
  return (
    <>
      {/* < sm: 6-колоночная таблица (min-w-[720px]) не помещается на телефоне без горизонтального
          скролла — по прямому запросу карточка на строку вместо этого, тот же брейкпоинт, что у
          ProductTable/DeliveryTable. Вся карточка — один Link (не отдельная chevron-кнопка внутри,
          как в десктопной таблице): на телефоне это одна touch-цель на всю ширину строки, а не
          маленькая иконка в углу. ≥ sm — обычная таблица без изменений. */}
      <div className="gap-sm flex flex-col sm:hidden">
        {orders.length === 0 ? (
          <p className="px-md py-3xl text-body-md text-center text-neutral-500">No orders yet.</p>
        ) : (
          orders.map((order) => (
            <Link
              key={order.id}
              href={`/nine-lives/dashboard/orders/${order.id}`}
              // border-l-4 (не общий border-l-* из border-shorthand) + прозрачный/paw цвет по
              // условию — левая полоса всегда занимает одну и ту же ширину, меняется только её
              // цвет, поэтому карточки new/остальные не «прыгают» по горизонтали относительно
              // друг друга. border-t/-r/-b отдельно от border-l — иначе более поздний по generated
              // CSS border-l-* переопределил бы цвет остальных трёх сторон тоже (тот же класс
              // конфликта Tailwind, что описан в Badge.tsx про w-full/w-20).
              className={`gap-xs rounded-md border-t border-r border-b border-l-4 border-neutral-300 p-md flex flex-col ${order.status === 'new' ? 'border-l-paw' : 'border-l-transparent'} ${FOCUS_RING_CLASSNAME}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-label-md text-neutral-900">#{order.id}</span>
                <Badge variant={ORDER_STATUS_BADGE_VARIANT[order.status]}>
                  {ORDER_STATUS_LABEL[order.status]}
                </Badge>
              </div>
              {/* font-semibold на status === 'new' — тот же приём, что непрочитанные письма в
                  почтовых клиентах: заказ обязан быть заметен уже по весу текста, не только по
                  бейджу статуса (Badge.tsx использует одинаково тихий bg-*-tint для всех 4
                  статусов — new/processing/done/cancelled визуально равны по контрасту, глаз не
                  цепляется именно за new). По прямому запросу усилено ещё и полосой слева выше
                  (border-l-paw) — тот же насыщенный `paw`, что и у счётчика в сайдбаре
                  (CounterBadge.tsx, bg-paw), не бледный bg-paw-tint статус-бейджа: чтобы яркий
                  «2 new» в меню и эти строки на странице считывались как один и тот же сигнал. */}
              <span
                className={`text-body-sm text-neutral-700 ${order.status === 'new' ? 'font-semibold' : ''}`}
              >
                {order.customerName}
              </span>
              <div className="flex items-center justify-between">
                <span
                  className={`text-body-sm text-neutral-500 ${order.status === 'new' ? 'font-semibold' : ''}`}
                >
                  {ORDER_DATE_FORMATTER.format(new Date(order.createdAt))}
                </span>
                <span className="text-label-md text-neutral-900">
                  {formatPrice(order.total, ADMIN_LOCALE)}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-md border border-neutral-300 sm:block">
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
            {/* colSpan-строка, не замена всей таблицы на текст: заголовок таблицы (Order/Customer/…)
                остаётся видимым и в пустом состоянии — так админ видит структуру, а не «пропавшую»
                таблицу. Реально достижимо теперь на пустой БД (getOrders() без заказов). */}
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-md py-3xl text-body-md text-center text-neutral-500">
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((order, index) => {
                // Тот же приём, что и в мобильной карточке выше (см. её комментарий) — вес
                // текста + полоса слева, не только Badge, отмечают заказы со статусом new.
                const isNew = order.status === 'new';
                const newRowClassName = isNew ? 'font-semibold' : '';
                // border-l-4 на первой ячейке строки, не на <tr> — под border-collapse на
                // <table> граница по левому краю самой строки рендерится не во всех браузерах
                // предсказуемо, ячейка гарантированно рисует свою границу. Прозрачный цвет у
                // остальных строк держит одинаковую ширину первой колонки для всех — не только
                // у new-строк.
                const accentBorderClassName = `border-l-4 ${isNew ? 'border-l-paw' : 'border-l-transparent'}`;
                return (
                  <tr key={order.id} className={adminTableRowClassName(index)}>
                    <td className={`${CELL_CLASSNAME} ${newRowClassName} ${accentBorderClassName}`}>
                      #{order.id}
                    </td>
                    <td className={`${CELL_CLASSNAME} ${newRowClassName}`}>{order.customerName}</td>
                    <td className={`${CELL_CLASSNAME} ${newRowClassName}`}>
                      {ORDER_DATE_FORMATTER.format(new Date(order.createdAt))}
                    </td>
                    <td className={`${CELL_CLASSNAME} ${newRowClassName}`}>
                      {formatPrice(order.total, ADMIN_LOCALE)}
                    </td>
                    <td className="px-md py-sm">
                      <Badge variant={ORDER_STATUS_BADGE_VARIANT[order.status]}>
                        {ORDER_STATUS_LABEL[order.status]}
                      </Badge>
                    </td>
                    <td className="px-md py-sm">
                      <Link
                        href={`/nine-lives/dashboard/orders/${order.id}`}
                        aria-label={`View order #${order.id}`}
                        className={`flex items-center justify-center ${iconActionButtonClassName()}`}
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
