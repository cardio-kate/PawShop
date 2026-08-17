'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, ClipboardList, Truck } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { CounterBadge } from '@/components/ui/CounterBadge';
import { FOCUS_RING_CLASSNAME } from '@/components/ui/interaction-styles';
import { MOCK_ORDERS } from '@/components/admin/mock-data';

// design.md → §7.8 ТЗ: три раздела админ-панели (Products/Orders/Delivery). Порядок — как в ТЗ,
// не алфавитный.
const NAV_ITEMS = [
  { href: '/admin/dashboard/products', label: 'Products', icon: Package },
  { href: '/admin/dashboard/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/dashboard/delivery', label: 'Delivery', icon: Truck },
];

const ORDERS_HREF = '/admin/dashboard/orders';

// ТЗ §9.3: новые заявки отмечаются визуально в панели — тот же CounterBadge, что у счётчика
// корзины в Header. MOCK_ORDERS не меняется в рантайме (нет реального backend, который бы
// мутировал заказы) — посчитать один раз на модуль, а не фильтровать заново на каждый рендер
// сайдбара (каждая навигация между /admin/dashboard/** страницами). С реальными данными это
// станет серверным значением (или отдельным мемо на реальный запрос), не клиентским фильтром.
const NEW_ORDERS_COUNT = MOCK_ORDERS.filter((order) => order.status === 'new').length;

const NAV_LINK_CLASSNAME = `flex items-center gap-sm rounded-md px-sm py-xs text-label-md transition-colors duration-fast motion-reduce:transition-none ${FOCUS_RING_CLASSNAME}`;

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
          const badgeCount = href === ORDERS_HREF ? NEW_ORDERS_COUNT : 0;
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
              {badgeCount > 0 && (
                <>
                  <CounterBadge count={badgeCount} />
                  <span className="sr-only">, {badgeCount} new</span>
                </>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
