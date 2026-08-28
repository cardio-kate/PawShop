'use client';

import { useState, useTransition } from 'react';
import { ChevronDown } from 'lucide-react';
import { updateOrderStatus } from '@/actions/orders.actions';
import { ORDER_STATUS_LABEL, orderStatusColorClassName } from '@/components/admin/constants';
import { FOCUS_RING_CLASSNAME } from '@/components/ui/interaction-styles';
import type { OrderStatus } from '@/types';

const STATUSES: OrderStatus[] = ['new', 'processing', 'done', 'cancelled'];

interface OrderStatusControlProps {
  orderId: number;
  status: OrderStatus;
}

// Фаза 5 плана оставила это read-only (см. история в OrderDetail.tsx) — action updateOrderStatus уже
// готов с Фазы 4, здесь только подключение UI. committed/rollback — тот же паттерн, что
// DeliveryTable.tsx: локальное состояние меняется сразу (оптимистично), откатывается назад при
// ошибке ответа сервера, не оставляет select в рассинхроне с БД.
export function OrderStatusControl({ orderId, status: initialStatus }: OrderStatusControlProps) {
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: OrderStatus) {
    const previous = status;
    setStatus(next);
    setError(null);
    startTransition(async () => {
      try {
        const result = await updateOrderStatus(orderId, next);
        if (!result.success) {
          setStatus(previous);
          setError(Object.values(result.errors)[0] ?? 'Failed to update status. Please try again.');
        }
      } catch {
        // updateOrderStatus бросает (а не возвращает {success:false}), если requireAdminSession()
        // не прошла — например, сессия истекла в другой вкладке, пока этот select был открыт.
        // Без catch откат никогда не срабатывал бы на этом пути, и UI молча показывал бы новый
        // статус как сохранённый, хотя в БД осталось старое значение.
        setStatus(previous);
        setError('Failed to update status. Please try again.');
      }
    });
  }

  return (
    <div className="gap-xs flex flex-col items-end">
      <div
        className={`relative rounded-md transition-colors duration-fast motion-reduce:transition-none ${orderStatusColorClassName(status)} ${isPending ? 'opacity-60' : ''}`}
      >
        <select
          value={status}
          disabled={isPending}
          onChange={(e) => handleChange(e.target.value as OrderStatus)}
          aria-label="Order status"
          // py-sm (не py-xs) — 12px line-height text-label-caps + 8px+8px padding = 28px,
          // единственная комбинация из уже существующих токенов, которая проходит touch-target
          // минимум 24×24px (WCAG 2.5.8, .claude/skills/a11y-review/SKILL.md §5); py-xs давал
          // только ~20px.
          className={`text-label-caps appearance-none bg-transparent py-sm pr-xl pl-[10px] outline-none disabled:cursor-not-allowed ${FOCUS_RING_CLASSNAME}`}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s} className="text-neutral-900">
              {ORDER_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="right-xs pointer-events-none absolute top-1/2 h-3 w-3 -translate-y-1/2 text-current"
        />
      </div>
      {error && (
        <span role="alert" className="text-body-sm text-error">
          {error}
        </span>
      )}
    </div>
  );
}
