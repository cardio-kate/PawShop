interface CounterBadgeProps {
  count: number;
  className?: string;
}

// design.md → badge-order-counter: bg-paw/text-surface — цвет лапки-лого, брендовая связка бейджа
// с логотипом (Iconography). Контраст белого текста на paw — 6.47:1, WCAG AA ок. Общий для
// CartButton (счётчик товаров в Header) и AdminSidebar (счётчик новых заказов) — раньше был
// продублирован в обоих местах отдельными строками классов.
export function CounterBadge({ count, className }: CounterBadgeProps) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-4 min-w-4 items-center justify-center rounded-full bg-paw px-1 text-[10px] font-semibold leading-none text-surface ${className ?? ''}`}
    >
      {count}
    </span>
  );
}
