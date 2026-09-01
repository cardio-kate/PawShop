import type { HTMLAttributes } from 'react';

export type BadgeVariant =
  'new' | 'out-of-stock' | 'order-new' | 'order-processing' | 'order-done' | 'order-cancelled';

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

// design.md → Components, badge-new: точечное исключение из typography.label-caps (12px) — 14px
// по прямому запросу, чтобы бейдж не терялся на фото карточки. Не токен `text-label-caps` +
// override-класс на месте использования: у обоих одинаковая специфичность, и какой из двух
// text-* классов победит, зависит от порядка правил в скомпилированном Tailwind-CSS, а не от
// порядка классов в JSX (та же ловушка, что была с `w-full` в TEXT_FIELD_BASE_CLASSNAME против
// `w-20` в price-инпутах каталога) — здесь у `new` вместо общего класса свой набор с нуля,
// конфликтовать не с чем. Остальные варианты остаются на `label-caps` (12px) без изменений.
const VARIANT_TYPOGRAPHY_CLASSNAME: Record<BadgeVariant, string> = {
  new: 'text-[14px] leading-none tracking-[0.06em] font-semibold',
  'out-of-stock': 'text-label-caps',
  'order-new': 'text-label-caps',
  'order-processing': 'text-label-caps',
  'order-done': 'text-label-caps',
  'order-cancelled': 'text-label-caps',
};

export const BADGE_COLOR_CLASSNAME: Record<BadgeVariant, string> = {
  new: 'bg-secondary text-neutral-900',
  'out-of-stock': 'bg-neutral-100 text-neutral-700',
  'order-new': 'bg-paw-tint text-paw',
  'order-processing': 'bg-tertiary-tint text-tertiary-on-tint',
  'order-done': 'bg-secondary-tint text-neutral-900',
  'order-cancelled': 'bg-error-tint text-error-on-tint',
};

export function Badge({ variant, className, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex w-fit items-center ${VARIANT_TYPOGRAPHY_CLASSNAME[variant]} ${VARIANT_SHAPE_CLASSNAME[variant]} ${BADGE_COLOR_CLASSNAME[variant]} ${className ?? ''}`}
      {...props}
    />
  );
}
