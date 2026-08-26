'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, unstable_rethrow } from 'next/navigation';
import { Package, ClipboardList, Truck, LogOut } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { CounterBadge } from '@/components/ui/CounterBadge';
import { FOCUS_RING_CLASSNAME } from '@/components/ui/interaction-styles';
import { adminLogout } from '@/actions/auth.actions';

// design.md → §7.8 ТЗ: три раздела админ-панели (Products/Orders/Delivery). Порядок — как в ТЗ,
// не алфавитный.
const NAV_ITEMS = [
  { href: '/nine-lives/dashboard/products', label: 'Products', icon: Package },
  { href: '/nine-lives/dashboard/orders', label: 'Orders', icon: ClipboardList },
  { href: '/nine-lives/dashboard/delivery', label: 'Delivery', icon: Truck },
];

const ORDERS_HREF = '/nine-lives/dashboard/orders';

const NAV_LINK_CLASSNAME = `flex items-center gap-sm rounded-md px-sm py-xs text-label-md transition-colors duration-fast motion-reduce:transition-none ${FOCUS_RING_CLASSNAME}`;

// adminLogout() редиректит на сервере при успехе (см. actions/auth.actions.ts, тот же паттерн, что
// у adminLogin) — сюда управление в этом случае не возвращается, а без unstable_rethrow catch ниже
// перехватил бы NEXT_REDIRECT и оставил бы кнопку в disabled-состоянии навсегда.
function SignOutButton() {
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    setIsPending(true);
    try {
      await adminLogout();
    } catch (error) {
      unstable_rethrow(error);
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`${NAV_LINK_CLASSNAME} mt-auto cursor-pointer text-neutral-700 hover:bg-neutral-100 hover:text-paw disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
      Sign out
    </button>
  );
}

interface AdminSidebarProps {
  // ТЗ §9.3: новые заявки отмечаются визуально в панели — тот же CounterBadge, что у счётчика
  // корзины в Header. Считается сервером (getNewOrdersCount(), без кэша — dashboard/layout.tsx) и
  // передаётся сюда пропом, а не фильтруется на клиенте — AdminSidebar сама не имеет доступа к
  // заказам (и не должна, это client-компонент только ради usePathname()).
  newOrdersCount: number;
}

export function AdminSidebar({ newOrdersCount }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="gap-lg bg-surface p-lg flex shrink-0 flex-col border-b border-neutral-200 sm:w-60 sm:border-r sm:border-b-0">
      <Link href="/nine-lives/dashboard/products" className="self-start">
        <Logo />
      </Link>
      <nav aria-label="Admin" className="gap-xs flex flex-row sm:flex-col">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          // /nine-lives/dashboard/products/new и /products/[id]/edit тоже должны подсвечивать
          // "Products" — startsWith, не точное совпадение пути.
          const active = pathname.startsWith(href);
          const badgeCount = href === ORDERS_HREF ? newOrdersCount : 0;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`${NAV_LINK_CLASSNAME} ${
                active
                  ? 'text-paw bg-neutral-100'
                  : 'hover:text-paw text-neutral-700 hover:bg-neutral-100'
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
      <SignOutButton />
    </aside>
  );
}
