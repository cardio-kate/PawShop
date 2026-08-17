import type { ButtonHTMLAttributes } from 'react';
import { FOCUS_RING_CLASSNAME } from '@/components/ui/interaction-styles';

interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ checked, onChange, disabled, className, ...props }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`duration-fast relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors motion-reduce:transition-none ${FOCUS_RING_CLASSNAME} disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-secondary' : 'bg-neutral-300'
      } ${className ?? ''}`}
      {...props}
    >
      <span
        aria-hidden="true"
        className={`bg-surface duration-fast inline-block h-5 w-5 transform rounded-full shadow transition-transform motion-reduce:transition-none ${
          checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
        }`}
      />
    </button>
  );
}
