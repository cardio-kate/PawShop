import type { ButtonHTMLAttributes } from 'react';

type ChipKind = 'filter' | 'variant';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: ChipKind;
  selected?: boolean;
}

const BASE_CLASSNAME =
  'inline-flex items-center justify-center whitespace-nowrap rounded-full border px-md py-sm text-body-sm transition-colors duration-fast motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

const DEFAULT_CLASSNAME = 'border-neutral-300 bg-surface text-neutral-700';

// design.md → chip-filter-selected (tint-фон) и variant-chip-selected (сплошная заливка) — два
// разных визуальных языка «выбрано» в зависимости от контекста использования чипа.
const SELECTED_CLASSNAME: Record<ChipKind, string> = {
  filter: 'border-primary bg-primary-tint text-primary',
  variant: 'border-primary bg-primary text-surface',
};

const DISABLED_CLASSNAME = 'cursor-not-allowed border-neutral-100 bg-neutral-100 text-neutral-500';

export function Chip({ kind = 'filter', selected = false, disabled, className, ...props }: ChipProps) {
  const stateClassName = disabled
    ? DISABLED_CLASSNAME
    : selected
      ? SELECTED_CLASSNAME[kind]
      : DEFAULT_CLASSNAME;

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      className={`${BASE_CLASSNAME} ${stateClassName} ${className ?? ''}`}
      {...props}
    />
  );
}
