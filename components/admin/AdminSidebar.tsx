'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, ClipboardList, Truck } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';

// design.md → §7.8 ТЗ: три раздела админ-панели (Products/Orders/Delivery). Порядок — как в ТЗ,
// не алфавитный.
const NAV_ITEMS = [
  { href: '/admin/dashboard/products', label: 'Products', icon: Package },
  { href: '/admin/dashboard/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/dashboard/delivery', label: 'Delivery', icon: Truck },
];

const NAV_LINK_CLASSNAME =
  'flex items-center gap-sm rounded-md px-sm py-xs text-label-md transition-colors duration-fast motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paw';

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex shrink-0 flex-col gap-lg border-b border-neutral-200 bg-surface p-lg sm:w-60 sm:border-b-0 sm:border-r">
      <Link href="/admin/dashboard/products" className="self-start">
        <Logo />
      </Link>
      <nav aria-label="Admin" className="flex flex-row gap-xs sm:flex-col">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          // /admin/dashboard/products/new и /products/[id]/edit тоже должны подсвечивать
          // "Products" — startsWith, не точное совпадение пути.
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`${NAV_LINK_CLASSNAME} ${
                active ? 'bg-neutral-100 text-paw' : 'text-neutral-700 hover:bg-neutral-100 hover:text-paw'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
