import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const BASE_CLASSNAME =
  'inline-flex items-center justify-center whitespace-nowrap rounded-full border px-[28px] py-[14px] text-label-md transition-colors duration-fast motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw';

const VARIANT_CLASSNAME: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-paw text-surface hover:bg-paw-hover active:bg-paw-active',
  secondary: 'border-paw bg-surface text-paw hover:bg-paw-tint active:border-paw-active active:bg-paw-tint active:text-paw-active',
};

// design.md → Button — disabled: единый визуальный язык (neutral-300/500) на весь проект,
// не приглушённый вариант основного цвета — общий и для primary, и для secondary.
const DISABLED_CLASSNAME = 'cursor-not-allowed border-neutral-300 bg-neutral-300 text-neutral-500';

export function Button({ variant = 'primary', disabled, className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`${BASE_CLASSNAME} ${disabled ? DISABLED_CLASSNAME : VARIANT_CLASSNAME[variant]} ${className ?? ''}`}
      {...props}
    />
  );
}
