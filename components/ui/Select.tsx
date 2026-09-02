import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { fieldStateClassName } from '@/components/ui/field-styles';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

// Своя база, не TEXT_FIELD_BASE_CLASSNAME (Input/Textarea): appearance-none и место под шеврон
// (pr-xl вместо px-md с обеих сторон), без placeholder-цвета — select его не показывает.
//
// text-[16px] на мобильном, sm:text-body-md — тот же фикс, что у TEXT_FIELD_SIZE_CLASSNAME
// (field-styles.ts): нативный <select> так же зумит страницу при фокусе на iOS Safari, если
// font-size < 16px (Delivery country — ровно то поле, дизайн-токен body-md меняется отдельной
// строкой, не через общий helper, потому что своя база).
const BASE_CLASSNAME =
  'w-full appearance-none rounded-md border bg-surface px-md py-[12px] pr-xl text-[16px] sm:text-body-md text-neutral-900 outline-none transition-colors duration-fast motion-reduce:transition-none disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500';

export function Select({ error, className, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        aria-invalid={error || undefined}
        className={`${BASE_CLASSNAME} ${fieldStateClassName(error)} ${className ?? ''}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="right-md pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-700"
      />
    </div>
  );
}
