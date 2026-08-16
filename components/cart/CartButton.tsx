'use client';

import { ShoppingCart } from 'lucide-react';
import { CounterBadge } from '@/components/ui/CounterBadge';

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
      {itemCount > 0 && <CounterBadge count={itemCount} className="absolute -right-0.5 -top-0.5" />}
    </button>
  );
}
