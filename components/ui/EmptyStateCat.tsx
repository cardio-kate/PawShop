import Image from 'next/image';

interface EmptyStateCatProps {
  className?: string;
}

// Тот же силуэт, что в ValuePropsSection (/home/cat.png) — не новый арт, повторное использование
// фирменного мотива в служебных пустых состояниях (пустая корзина, "ничего не найдено" в каталоге).
// opacity-20 — чтобы визуально держать тот же приглушённый вес, что design.md → empty-state-icon
// (neutral-300 у прежней иконки lucide), а не выглядеть как полноценная иллюстрация не в масштабе.
export function EmptyStateCat({ className }: EmptyStateCatProps) {
  return (
    <Image
      src="/home/cat.png"
      alt=""
      width={1120}
      height={957}
      className={`h-16 w-auto opacity-20 ${className ?? ''}`}
      aria-hidden="true"
    />
  );
}
