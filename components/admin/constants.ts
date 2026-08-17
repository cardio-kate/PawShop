import { BADGE_COLOR_CLASSNAME, type BadgeVariant } from '@/components/ui/Badge';
import type { OrderStatus } from '@/types';

// Общее для ProductTable/OrderTable/OrderDetail — раньше было продублировано в каждом файле по
// отдельности; design.md → «Что не локализуется» держит админку на фиксированном английском, без
// useLocale.
export const ADMIN_LOCALE = 'en';

// design.md → Admin table: единая ячейка для ProductTable/OrderTable/OrderDetail. VariantEditor
// использует более компактный вариант (px-sm py-xs) — там ячейки хостят инпуты формы, а не просто
// текст, это осознанно другой, не «отклонившийся» вариант, поэтому не вынесен сюда же.
export const ADMIN_TABLE_CELL_CLASSNAME = 'px-md py-sm text-body-sm text-neutral-900';

// Та же зебра-полоска (design.md → Elevation & Depth, table-row-even/odd) была продублирована
// построчно в ProductTable/OrderTable/VariantEditor/OrderDetail — одна функция вместо четырёх
// копий одного и того же тернарника.
export function adminTableRowClassName(index: number): string {
  return `border-b border-neutral-300 last:border-b-0 ${index % 2 === 0 ? 'bg-neutral-100' : 'bg-surface'}`;
}

// §10 ТЗ: товар обязан иметь минимум одно фото и один вариант — общий порог для ImageUploader
// (кнопка удаления скрыта у последнего элемента), VariantEditor (то же самое) и ProductForm
// (Save недоступен, пока фото/вариантов меньше минимума). Одна константа вместо независимых `1`/
// `0` в трёх файлах — если минимум когда-нибудь изменится (например, черновики без вариантов),
// это одна правка, а не риск разъехаться.
export const PRODUCT_MIN_ITEMS = 1;

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'New',
  processing: 'Processing',
  done: 'Done',
  cancelled: 'Cancelled',
};

// Единственный источник связи OrderStatus → BadgeVariant — раньше OrderTable держал такую же карту
// у себя локально, а OrderDetail параллельно — независимую карту цветов под свои же 4 статуса
// (STATUS_SELECT_CLASSNAME), с теми же bg-*-tint/text-* парами, что и в Badge.tsx. Один источник —
// OrderTable берёт variant для <Badge>, OrderDetail (через orderStatusColorClassName ниже) — только
// цветовую часть для <select>, у которого своя форма (rounded-md на всю ширину, не rounded-full).
export const ORDER_STATUS_BADGE_VARIANT: Record<OrderStatus, BadgeVariant> = {
  new: 'order-new',
  processing: 'order-processing',
  done: 'order-done',
  cancelled: 'order-cancelled',
};

export function orderStatusColorClassName(status: OrderStatus): string {
  return BADGE_COLOR_CLASSNAME[ORDER_STATUS_BADGE_VARIANT[status]];
}

// Список заказов — только дата (компактно), деталь заказа — дата и время (точнее). Разные форматы
// намеренно, не дублирование одного и того же: два именованных константных экспорта вместо двух
// локальных копий с риском разойтись незаметно.
export const ORDER_DATE_FORMATTER = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export const ORDER_DATETIME_FORMATTER = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
