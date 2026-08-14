import type { HTMLAttributes } from 'react';

type BadgeVariant = 'new' | 'out-of-stock' | 'order-new' | 'order-processing' | 'order-done' | 'order-cancelled';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant: BadgeVariant;
}

// design.md → Components: badge-new/badge-out-of-stock/badge-status-* — форма и цвета различаются
// по варианту (out-of-stock — rounded.sm, остальные — rounded.full), поэтому классы заданы целиком
// на вариант, а не собраны из общих base+color кусков.
const VARIANT_CLASSNAME: Record<BadgeVariant, string> = {
  new: 'rounded-full bg-secondary px-[10px] py-xs text-neutral-900',
  'out-of-stock': 'rounded-sm bg-neutral-100 px-sm py-xs text-neutral-500',
  'order-new': 'rounded-full bg-paw-tint px-[10px] py-xs text-paw',
  'order-processing': 'rounded-full bg-tertiary-tint px-[10px] py-xs text-tertiary-on-tint',
  'order-done': 'rounded-full bg-secondary-tint px-[10px] py-xs text-neutral-900',
  'order-cancelled': 'rounded-full bg-error-tint px-[10px] py-xs text-error-on-tint',
};

export function Badge({ variant, className, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex w-fit items-center text-label-caps ${VARIANT_CLASSNAME[variant]} ${className ?? ''}`}
      {...props}
    />
  );
}
