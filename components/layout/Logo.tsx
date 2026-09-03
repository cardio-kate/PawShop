import Image from 'next/image';

interface LogoProps {
  className?: string;
  // Header.tsx: на мобильной ширине лого стоит над подписью (компактнее по горизонтали), на
  // остальных — рядом. Раньше мобильный вариант просто копировал разметку Image+span заново
  // вместо этого компонента — один src/размер/priority теперь поддерживается в одном месте.
  stacked?: boolean;
  // Header.tsx (витрина) — Fraunces, тот же display-шрифт, что у typography.section-heading.
  // AdminSidebar/StaffLoginCard оставляют дефолт (Inter) — admin/staff-entry намеренно без
  // флёра витрины (CLAUDE.md), и там даже не подключён --font-fraunces (app/(admin)/layout.tsx).
  displayFont?: boolean;
}

export function Logo({ className, stacked, displayFont }: LogoProps) {
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
        // Next 16: priority сам по себе не выставляет fetchpriority="high" (проп независимый,
        // node_modules/next/dist/shared/lib/get-img-props.js) — Header рендерится на каждой
        // странице, лого — часть первого экрана везде.
        fetchPriority="high"
      />
      <span className={`text-h3 text-neutral-900 ${displayFont ? 'font-display' : ''}`}>
        PawShop
      </span>
    </span>
  );
}
