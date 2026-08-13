import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

// Locale-negotiation only (redirect `/` → `/en`/`/de`) — JWT-проверка для
// /admin/dashboard/** добавляется в этот же файл позже (см. CLAUDE.md, «Auth и сессии»),
// второй proxy.ts Next.js не поддерживает.
export default createMiddleware(routing);

export const config = {
  // /admin и /staff-entry — нелокализованная ветка (app/(admin)/**), locale-negotiation
  // на неё не распространяется.
  matcher: '/((?!api|admin|staff-entry|_next|_vercel|.*\\..*).*)',
};
