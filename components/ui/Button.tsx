import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import { FOCUS_RING_CLASSNAME } from '@/components/ui/interaction-styles';

type ButtonVariant = 'primary' | 'secondary';
type ButtonSize = 'md' | 'sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  // Навигационная ссылка, оформленная как кнопка (например «+ Add product» на списке товаров) —
  // без этого приходилось вручную копировать BASE_CLASSNAME/SIZE_CLASSNAME/VARIANT_CLASSNAME на
  // отдельный <Link>, и правка стилей Button не долетала бы до таких мест. button-специфичные
  // props (type, onClick с MouseEvent<HTMLButtonElement> и т.д.) в этой ветке не пробрасываются —
  // единственный сегодняшний случай использования не в них нуждается.
  href?: string;
}

const BASE_CLASSNAME = `inline-flex items-center justify-center whitespace-nowrap rounded-full border px-[28px] text-label-md transition-colors duration-fast motion-reduce:transition-none ${FOCUS_RING_CLASSNAME}`;

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
  primary:
    'cursor-pointer border-transparent bg-paw text-surface hover:bg-paw-hover active:bg-paw-active',
  secondary:
    'cursor-pointer border-paw bg-surface text-paw hover:bg-paw-tint active:border-paw-active active:bg-paw-tint active:text-paw-active',
};

// design.md → Button — disabled: единый визуальный язык (neutral-300/500) на весь проект,
// не приглушённый вариант основного цвета — общий и для primary, и для secondary.
const DISABLED_CLASSNAME = 'cursor-not-allowed border-neutral-300 bg-neutral-300 text-neutral-500';

export function Button({
  variant = 'primary',
  size = 'md',
  disabled,
  className,
  href,
  children,
  ...props
}: ButtonProps) {
  const classes = `${BASE_CLASSNAME} ${SIZE_CLASSNAME[size]} ${disabled ? DISABLED_CLASSNAME : VARIANT_CLASSNAME[variant]} ${className ?? ''}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children as ReactNode}
      </Link>
    );
  }

  return (
    <button type="button" disabled={disabled} className={classes} {...props}>
      {children}
    </button>
  );
}
