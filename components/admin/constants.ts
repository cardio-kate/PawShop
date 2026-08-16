import type { OrderStatus } from '@/types';

// Общее для ProductTable/OrderTable/OrderDetail — раньше было продублировано в каждом файле по
// отдельности; design.md → «Что не локализуется» держит админку на фиксированном английском, без
// useLocale.
export const ADMIN_LOCALE = 'en';

// design.md → Admin table: единая ячейка для ProductTable/OrderTable/OrderDetail. VariantEditor
// использует более компактный вариант (px-sm py-xs) — там ячейки хостят инпуты формы, а не просто
// текст, это осознанно другой, не «отклонившийся» вариант, поэтому не вынесен сюда же.
export const ADMIN_TABLE_CELL_CLASSNAME = 'px-md py-sm text-body-sm text-neutral-900';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'New',
  processing: 'Processing',
  done: 'Done',
  cancelled: 'Cancelled',
};

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
