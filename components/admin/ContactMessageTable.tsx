import {
  ADMIN_TABLE_CELL_CLASSNAME,
  ORDER_DATETIME_FORMATTER,
  adminTableRowClassName,
} from '@/components/admin/constants';
import type { ContactMessageListItem } from '@/lib/db/queries/contact.queries';

const CELL_CLASSNAME = ADMIN_TABLE_CELL_CLASSNAME;

interface ContactMessageTableProps {
  messages: ContactMessageListItem[];
}

// Только чтение — по решению от 2026-08-29 (.claude/plans/backend-realization-pawshop.md → Фаза 7
// STATUS) без detail-страницы и без действий над строкой: весь контент заявки (имя/email/телефон/
// комментарий) умещается в списке, отдельный экран не нужен, в отличие от OrderTable → OrderDetail
// (там позиции заказа не уместились бы). ORDER_DATETIME_FORMATTER (не ORDER_DATE_FORMATTER) — раз
// нет отдельной детальной страницы с точным временем, список сразу показывает дату и время.
export function ContactMessageTable({ messages }: ContactMessageTableProps) {
  return (
    <>
      {/* < sm: карточка на строку — тот же брейкпоинт/приём, что у OrderTable/ProductTable/
          DeliveryTable, без ссылки (в отличие от OrderTable) — тут нет отдельной страницы деталей. */}
      <div className="gap-sm flex flex-col sm:hidden">
        {messages.length === 0 ? (
          <p className="px-md py-3xl text-body-md text-center text-neutral-500">No messages yet.</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className="gap-xs rounded-md border border-neutral-300 p-md flex flex-col"
            >
              <div className="flex items-center justify-between">
                <span className="text-label-md text-neutral-900">{message.name}</span>
                <span className="text-body-sm text-neutral-500">
                  {ORDER_DATETIME_FORMATTER.format(new Date(message.createdAt))}
                </span>
              </div>
              <span className="text-body-sm text-neutral-700">{message.email}</span>
              {message.phone && <span className="text-body-sm text-neutral-700">{message.phone}</span>}
              {message.comment && (
                <p className="text-body-sm mt-xs text-neutral-700">{message.comment}</p>
              )}
            </div>
          ))
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-md border border-neutral-300 sm:block">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-neutral-300">
              <th scope="col" className={`${CELL_CLASSNAME} text-label-md`}>
                Name
              </th>
              <th scope="col" className={`${CELL_CLASSNAME} text-label-md`}>
                Email
              </th>
              <th scope="col" className={`${CELL_CLASSNAME} text-label-md`}>
                Phone
              </th>
              <th scope="col" className={`${CELL_CLASSNAME} text-label-md`}>
                Comment
              </th>
              <th scope="col" className={`${CELL_CLASSNAME} text-label-md`}>
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {/* colSpan-строка, не замена всей таблицы — тот же приём, что OrderTable/ProductTable:
                заголовок остаётся видимым и на пустой БД. */}
            {messages.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-md py-3xl text-body-md text-center text-neutral-500">
                  No messages yet.
                </td>
              </tr>
            ) : (
              messages.map((message, index) => (
                <tr key={message.id} className={adminTableRowClassName(index)}>
                  <td className={CELL_CLASSNAME}>{message.name}</td>
                  <td className={CELL_CLASSNAME}>{message.email}</td>
                  <td className={CELL_CLASSNAME}>{message.phone ?? '—'}</td>
                  <td className={`${CELL_CLASSNAME} max-w-[320px]`}>{message.comment ?? '—'}</td>
                  <td className={CELL_CLASSNAME}>
                    {ORDER_DATETIME_FORMATTER.format(new Date(message.createdAt))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
