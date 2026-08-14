import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const BASE_CLASSNAME =
  'w-full rounded-md border bg-surface px-md py-[12px] text-body-md text-neutral-900 outline-none transition-colors duration-fast placeholder:text-neutral-500 motion-reduce:transition-none disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500';

const STATE_CLASSNAME = {
  default: 'border-neutral-300 focus:border-paw',
  error: 'border-error text-error focus:border-error',
};

export function Input({ error, className, ...props }: InputProps) {
  return (
    <input
      aria-invalid={error || undefined}
      className={`${BASE_CLASSNAME} ${error ? STATE_CLASSNAME.error : STATE_CLASSNAME.default} ${className ?? ''}`}
      {...props}
    />
  );
}
