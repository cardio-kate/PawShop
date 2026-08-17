// Общий фокус-ринг для интерактивных элементов (WCAG 2.4.7) — та же строка была продублирована
// дословно в 30+ местах по всему проекту (Button/Chip/Toggle/Header/Footer/CartItem/ProductCard и
// т.д.), тот же класс проблемы, что field-styles.ts уже решил для полей форм.
export const FOCUS_RING_CLASSNAME =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw';

const ICON_ACTION_BUTTON_BASE_CLASSNAME =
  'cursor-pointer rounded-full p-1 text-neutral-700 transition-colors duration-fast motion-reduce:transition-none';

const ICON_ACTION_BUTTON_HOVER_CLASSNAME = {
  default: 'hover:text-paw',
  danger: 'hover:text-error',
} as const;

// Круглая icon-кнопка действия (close/edit/remove) — та же форма+hover+focus-ring были независимо
// скопированы в Panel (close), ProductTable (edit/delete), VariantEditor (remove), OrderTable
// (view) — отличаются только цветом hover (danger — для удаления) и позиционированием/доп.
// классами, которые остаются на вызывающей стороне.
export function iconActionButtonClassName(variant: 'default' | 'danger' = 'default'): string {
  return `${ICON_ACTION_BUTTON_BASE_CLASSNAME} ${ICON_ACTION_BUTTON_HOVER_CLASSNAME[variant]} ${FOCUS_RING_CLASSNAME}`;
}
