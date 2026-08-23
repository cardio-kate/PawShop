import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { verifyAdminSession } from '@/lib/auth';
import { ADMIN_SESSION_COOKIE } from '@/lib/constants';

const intlProxy = createMiddleware(routing);

// JWT-проверка только для /nine-lives/dashboard/** (architecture.md §3.4) — /staff-entry публичный,
// вне этой проверки по конструкции, не по недосмотру. /nine-lives — намеренно непредсказуемый префикс
// (не /admin), чтобы боты-сканеры, перебирающие типовые пути, не находили дашборд по шаблону; сама
// защита при этом — не переименование, а проверка сессии ниже, переименование лишь снижает шум.
// Остальной трафик идёт в next-intl как раньше. Один файл на обе задачи — второй proxy.ts Next.js
// не поддерживает.
export default async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/nine-lives/dashboard')) {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const session = token ? await verifyAdminSession(token) : null;
    if (!session) {
      return NextResponse.redirect(new URL('/staff-entry', request.url));
    }
    return NextResponse.next();
  }

  return intlProxy(request);
}

export const config = {
  matcher: [
    // /nine-lives и /staff-entry — нелокализованная ветка (app/(admin)/**), locale-negotiation
    // на неё не распространяется.
    '/((?!api|nine-lives|staff-entry|_next|_vercel|.*\\..*).*)',
    // JWT-проверка дашборда — отдельный паттерн в том же matcher-массиве, не второй файл.
    '/nine-lives/dashboard/:path*',
  ],
};
