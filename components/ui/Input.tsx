import type { InputHTMLAttributes } from 'react';
import { TEXT_FIELD_BASE_CLASSNAME, TEXT_FIELD_SIZE_CLASSNAME, fieldStateClassName } from '@/components/ui/field-styles';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  // Не называть `size` — HTMLInputElement уже несёт нативный `size` (ширина в символах),
  // переобъявление с несовместимым типом не скомпилируется.
  compact?: boolean;
}

export function Input({ error, compact, className, ...props }: InputProps) {
  return (
    <input
      aria-invalid={error || undefined}
      className={`${TEXT_FIELD_BASE_CLASSNAME} ${compact ? TEXT_FIELD_SIZE_CLASSNAME.compact : TEXT_FIELD_SIZE_CLASSNAME.default} ${fieldStateClassName(error)} ${className ?? ''}`}
      {...props}
    />
  );
}
