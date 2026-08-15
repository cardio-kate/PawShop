import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary';
type ButtonSize = 'md' | 'sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const BASE_CLASSNAME =
  'inline-flex items-center justify-center whitespace-nowrap rounded-full border px-[28px] text-label-md transition-colors duration-fast motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw';

// sm — вдвое ниже md (высота, не ширина): пока единственный случай — Add to Cart на странице
// товара (ProductDetailClient.tsx), где кнопка встаёт в ряд с компактными chip-вариантами.
const SIZE_CLASSNAME: Record<ButtonSize, string> = {
  md: 'py-[14px]',
  sm: 'py-[7px]',
};

// cursor-pointer живёт в VARIANT_CLASSNAME, не в BASE_CLASSNAME: у обоих классов курсора одна и
// та же CSS-специфичность, и в скомпилированном Tailwind-стилшите cursor-pointer идёт позже
// cursor-not-allowed — если оба класса присутствуют на disabled-кнопке одновременно, выигрывает
// pointer, а не not-allowed. Держим их взаимоисключающими через branching, как остальные стили.
const VARIANT_CLASSNAME: Record<ButtonVariant, string> = {
  primary: 'cursor-pointer border-transparent bg-paw text-surface hover:bg-paw-hover active:bg-paw-active',
  secondary:
    'cursor-pointer border-paw bg-surface text-paw hover:bg-paw-tint active:border-paw-active active:bg-paw-tint active:text-paw-active',
};

// design.md → Button — disabled: единый визуальный язык (neutral-300/500) на весь проект,
// не приглушённый вариант основного цвета — общий и для primary, и для secondary.
const DISABLED_CLASSNAME = 'cursor-not-allowed border-neutral-300 bg-neutral-300 text-neutral-500';

export function Button({ variant = 'primary', size = 'md', disabled, className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`${BASE_CLASSNAME} ${SIZE_CLASSNAME[size]} ${disabled ? DISABLED_CLASSNAME : VARIANT_CLASSNAME[variant]} ${className ?? ''}`}
      {...props}
    />
  );
}
