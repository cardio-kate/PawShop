import Image from 'next/image';

interface LogoProps {
  className?: string;
  // Header.tsx: на мобильной ширине лого стоит над подписью (компактнее по горизонтали), на
  // остальных — рядом. Раньше мобильный вариант просто копировал разметку Image+span заново
  // вместо этого компонента — один src/размер/priority теперь поддерживается в одном месте.
  stacked?: boolean;
}

export function Logo({ className, stacked }: LogoProps) {
  return (
    <span
      className={`inline-flex items-center ${stacked ? 'flex-col gap-1' : 'gap-2'} ${className ?? ''}`}
    >
      <Image
        src="/logo.png"
        alt=""
        width={38}
        height={38}
        className="h-[38px] w-[38px] shrink-0"
        priority
      />
      <span className="text-h3 text-neutral-900">PawShop</span>
    </span>
  );
}
