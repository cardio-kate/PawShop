import type { HTMLAttributes } from 'react';

export type BadgeVariant = 'new' | 'out-of-stock' | 'order-new' | 'order-processing' | 'order-done' | 'order-cancelled';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant: BadgeVariant;
}

// design.md → Components: badge-new/badge-out-of-stock/badge-status-* — форма (rounded/padding) и
// цвет разделены: форма нужна только самому Badge, а цвет (BADGE_COLOR_CLASSNAME) переиспользует и
// OrderDetail.tsx для select-а статуса заказа — та же пара bg-*-tint/text-*, что и на бейдже в
// OrderTable, без второй независимой копии тех же классов под другими ключами.
const VARIANT_SHAPE_CLASSNAME: Record<BadgeVariant, string> = {
  new: 'rounded-full px-[10px] py-xs',
  'out-of-stock': 'rounded-sm px-sm py-xs',
  'order-new': 'rounded-full px-[10px] py-xs',
  'order-processing': 'rounded-full px-[10px] py-xs',
  'order-done': 'rounded-full px-[10px] py-xs',
  'order-cancelled': 'rounded-full px-[10px] py-xs',
};

export const BADGE_COLOR_CLASSNAME: Record<BadgeVariant, string> = {
  new: 'bg-secondary text-neutral-900',
  'out-of-stock': 'bg-neutral-100 text-neutral-500',
  'order-new': 'bg-paw-tint text-paw',
  'order-processing': 'bg-tertiary-tint text-tertiary-on-tint',
  'order-done': 'bg-secondary-tint text-neutral-900',
  'order-cancelled': 'bg-error-tint text-error-on-tint',
};

export function Badge({ variant, className, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex w-fit items-center text-label-caps ${VARIANT_SHAPE_CLASSNAME[variant]} ${BADGE_COLOR_CLASSNAME[variant]} ${className ?? ''}`}
      {...props}
    />
  );
}
