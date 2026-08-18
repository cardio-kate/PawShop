interface LiveRegionProps {
  message: string;
}

// Разметка aria-live-региона, наполняемого lib/hooks/useAnnouncement.ts — обе стороны одного
// паттерна меняются вместе. polite, не assertive: подтверждение добавления в корзину не настолько
// срочное, чтобы прерывать то, что скринридер уже озвучивает.
export function LiveRegion({ message }: LiveRegionProps) {
  return (
    <span aria-live="polite" className="sr-only">
      {message}
    </span>
  );
}
