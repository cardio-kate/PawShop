'use client';

import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { X } from 'lucide-react';

type PanelSide = 'left' | 'right';

interface PanelProps {
  open: boolean;
  onClose: () => void;
  side?: PanelSide;
  ariaLabel: string;
  closeLabel: string;
  children: ReactNode;
  className?: string;
}

const SIDE_CLASSNAME: Record<PanelSide, string> = {
  right: 'right-0 rounded-l-lg',
  left: 'left-0 rounded-r-lg',
};

const SIDE_HIDDEN_TRANSFORM: Record<PanelSide, string> = {
  right: 'translate-x-full',
  left: '-translate-x-full',
};

// Экспортируется — тот же список используется для focus-trap в Header.tsx (мобильное меню):
// та же семантика «что считается фокусируемым», два независимых определения расходились бы
// молча при правке одного из них.
export const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Panel({ open, onClose, side = 'right', ariaLabel, closeLabel, children, className }: PanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCloseRef.current();
    }
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [open]);

  function handleTabKey(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Tab' || !panelRef.current) return;

    const focusable = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) {
      e.preventDefault();
      return;
    }

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    // Панель остаётся в DOM всегда — transform/opacity анимируются CSS-переходом напрямую на смену
    // `open` (без JS-таймера на анимацию закрытия и без двойного rAF на вход, нужного при
    // монтировании/размонтировании через state). `inert` при закрытой панели убирает её и из
    // хит-теста, и из фокуса/accessibility-дерева одним атрибутом (React 19); aria-hidden — запасной
    // сигнал для AT, не полагающихся на inert.
    <div inert={!open} aria-hidden={!open} className="fixed inset-0 z-50">
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`absolute inset-0 bg-neutral-900/40 transition-opacity duration-base motion-reduce:transition-none ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        onKeyDown={handleTabKey}
        className={`absolute inset-y-0 flex w-full flex-col bg-surface shadow-[0_4px_16px_rgba(14,14,18,0.08)] outline-none transition-transform duration-base motion-reduce:transition-none sm:w-[400px] ${SIDE_CLASSNAME[side]} ${
          open ? 'translate-x-0' : SIDE_HIDDEN_TRANSFORM[side]
        } ${className ?? ''}`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="absolute right-md top-md z-10 cursor-pointer rounded-full p-1 text-neutral-700 transition-colors duration-fast hover:text-paw motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>
  );
}
