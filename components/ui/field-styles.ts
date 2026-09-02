// Общие токены для полей форм — раньше border/focus/error-состояние (STATE_CLASSNAME) было
// продублировано слово-в-слово в Input/Select/Textarea по отдельности, а полная база
// (BASE_CLASSNAME) — ещё и между Input/Textarea (у Select своя: appearance-none, место под
// шеврон, без placeholder — не унифицирована сюда же, это осознанно другое поле, а не
// отклонившийся дубликат). design.md → input-field/input-field-focus/input-field-error.
export const FIELD_STATE_CLASSNAME = {
  default: 'border-neutral-300 focus:border-paw',
  error: 'border-error text-error focus:border-error',
} as const;

export function fieldStateClassName(error?: boolean): string {
  return error ? FIELD_STATE_CLASSNAME.error : FIELD_STATE_CLASSNAME.default;
}

export const TEXT_FIELD_BASE_CLASSNAME =
  'w-full rounded-md border bg-surface text-neutral-900 outline-none transition-colors duration-fast placeholder:text-neutral-500 motion-reduce:transition-none disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500';

// design.md → Components «Price range filter»: компактный вариант (padding 8px 12px, body-sm)
// сейчас нужен только Input (два числовых поля в CatalogClient) — Textarea всегда полноразмерный.
//
// text-[16px] на мобильном, только от sm: — дизайн-токен (design.md → body-md/body-sm, 15/14px):
// iOS Safari зумит всю страницу при фокусе на поле с font-size < 16px (виден по sticky-хедеру,
// съезжающему за правый край экрана — не баг вёрстки хедера, поведение самого Safari). Захватывает
// только мобильный диапазон, где есть тач-клавиатура и это поведение вообще применимо — на sm+
// (планшет/десктоп, курсор+клавиатура) возвращается настоящий токен без визуального отличия.
export const TEXT_FIELD_SIZE_CLASSNAME = {
  default: 'px-md py-[12px] text-[16px] sm:text-body-md',
  compact: 'px-[12px] py-sm text-[16px] sm:text-body-sm',
} as const;
