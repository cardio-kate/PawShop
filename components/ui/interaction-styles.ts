// Общий фокус-ринг для интерактивных элементов (WCAG 2.4.7) — та же строка была продублирована
// дословно в 30+ местах по всему проекту (Button/Chip/Toggle/Header/Footer/CartItem/ProductCard и
// т.д.), тот же класс проблемы, что field-styles.ts уже решил для полей форм.
export const FOCUS_RING_CLASSNAME =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw';

const ICON_ACTION_BUTTON_BASE_CLASSNAME =
  'cursor-pointer rounded-full p-1 transition-colors duration-fast motion-reduce:transition-none';

// Цвет — часть варианта, не общей базы: design.md → «Nav link» держит три разных базовых цвета для
// формально одной и той же формы иконки-кнопки, это не отклонение, а фиксированная часть системы:
// `trigger` (neutral-900) — только триггеры верхнего уровня Header (бургер/поиск/корзина, «тот же
// neutral-900, чтобы не спорить весом с текстом нав-списка рядом»); `default` (neutral-700) —
// обычное действие таблицы/панели (Panel close, ProductTable edit, OrderTable view); `muted`
// (neutral-500) — второстепенное действие внутри уже раскрытого поля/строки (Header search
// clear/close, CartItem remove — крестик рядом с контентом, которым он управляет, не самостоятельный
// пункт навигации). `danger` — тот же neutral-700, что и default, но hover уходит в error, а не paw.
export const ICON_ACTION_BUTTON_VARIANT_CLASSNAME = {
  default: 'text-neutral-700 hover:text-paw',
  trigger: 'text-neutral-900 hover:text-paw',
  muted: 'text-neutral-500 hover:text-paw',
  danger: 'text-neutral-700 hover:text-error',
} as const;

export function iconActionButtonClassName(
  variant: keyof typeof ICON_ACTION_BUTTON_VARIANT_CLASSNAME = 'default',
): string {
  return `${ICON_ACTION_BUTTON_BASE_CLASSNAME} ${ICON_ACTION_BUTTON_VARIANT_CLASSNAME[variant]} ${FOCUS_RING_CLASSNAME}`;
}
