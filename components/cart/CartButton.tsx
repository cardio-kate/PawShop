'use client';

import { ShoppingCart } from 'lucide-react';

interface CartButtonProps {
  itemCount: number;
  onClick: () => void;
  label: string;
  className?: string;
}

// Визуальный класс иконки-триггера (hover/focus-ring/размер) приходит из Header целиком через
// className — там же живут HEADER_TRIGGER_ICON_BUTTON_CLASSNAME и условное скрытие при открытом
// поиске (design.md → Header, единый язык всех icon-кнопок шапки), дублировать его здесь не нужно.
export function CartButton({ itemCount, onClick, label, className }: CartButtonProps) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className={`relative shrink-0 ${className ?? ''}`}>
      <ShoppingCart className="h-5 w-5" aria-hidden="true" />
      {itemCount > 0 && (
        // bg-paw — цвет лапки-лого, брендовая связка бейджа с логотипом (design.md → Iconography).
        // Контраст белого текста на paw — 6.47:1, WCAG AA ок.
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-paw px-1 text-[10px] font-semibold leading-none text-surface"
        >
          {itemCount}
        </span>
      )}
    </button>
  );
}
