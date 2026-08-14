import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

const BASE_CLASSNAME =
  'w-full appearance-none rounded-md border bg-surface px-md py-[12px] pr-xl text-body-md text-neutral-900 outline-none transition-colors duration-fast motion-reduce:transition-none disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500';

const STATE_CLASSNAME = {
  default: 'border-neutral-300 focus:border-paw',
  error: 'border-error text-error focus:border-error',
};

export function Select({ error, className, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        aria-invalid={error || undefined}
        className={`${BASE_CLASSNAME} ${error ? STATE_CLASSNAME.error : STATE_CLASSNAME.default} ${className ?? ''}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-md top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-700"
      />
    </div>
  );
}
