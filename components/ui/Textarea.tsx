import type { TextareaHTMLAttributes } from 'react';
import {
  TEXT_FIELD_BASE_CLASSNAME,
  TEXT_FIELD_SIZE_CLASSNAME,
  fieldStateClassName,
} from '@/components/ui/field-styles';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ error, className, ...props }: TextareaProps) {
  return (
    <textarea
      aria-invalid={error || undefined}
      className={`${TEXT_FIELD_BASE_CLASSNAME} ${TEXT_FIELD_SIZE_CLASSNAME.default} ${fieldStateClassName(error)} ${className ?? ''}`}
      {...props}
    />
  );
}
