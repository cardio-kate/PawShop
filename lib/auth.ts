import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { ADMIN_SESSION_COOKIE } from '@/lib/constants';
import { getAdminSessionVersion } from '@/lib/db/queries/admin.queries';

// Два независимых блока (architecture.md §3.4, п.1): верификация сессии (jose — одинаково работает
// в Node и Edge, используется и здесь, и в proxy.ts) и хэширование пароля (bcrypt — только в
// services через этот модуль, proxy.ts его не импортирует).

const JWT_ALG = 'HS256';
const BCRYPT_SALT_ROUNDS = 12;

export interface SessionPayload {
  adminId: number;
  sessionVersion: number;
}

// Читается лениво внутри функций, а не один раз на модуль верхнего уровня — иначе тесты и любой
// другой код, импортирующий lib/auth.ts до того, как env реально загружен, молча подписывали бы
// токены на encode(undefined) вместо явной ошибки в момент фактического использования.
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('lib/auth.ts: JWT_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const expiresIn = process.env.JWT_EXPIRES_IN;
  if (!expiresIn) {
    throw new Error('lib/auth.ts: JWT_EXPIRES_IN is not set');
  }
  return new SignJWT({ adminId: payload.adminId, sessionVersion: payload.sessionVersion })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getJwtSecret());
}

// null на любой сбой верификации (подпись, срок действия, битый payload) — вызывающий код не
// различает причины, ему нужно только "валидна сессия или нет".
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    // Явный allow-list алгоритмов — доп. слой защиты поверх дефолтного поведения jose (сама
    // библиотека уже отвергает "alg: none" и алгоритмы, несовместимые с сырым симметричным ключом).
    const { payload } = await jwtVerify(token, getJwtSecret(), { algorithms: [JWT_ALG] });
    if (typeof payload.adminId !== 'number' || typeof payload.sessionVersion !== 'number') {
      return null;
    }
    return { adminId: payload.adminId, sessionVersion: payload.sessionVersion };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Полная проверка сессии: JWT (подпись/срок) + sessionVersion из токена сверяется с текущим
// значением в БД (architecture.md §3.4) — без второй половины resetPassword не инвалидирует уже
// выданные токены до истечения JWT_EXPIRES_IN. Общий код для requireAdminSession() (Server Actions,
// токен из next/headers cookies()) и proxy.ts (токен из NextRequest.cookies — другой API, но та же
// проверка), чтобы правило "sessionVersion сверяется с БД" не разъехалось между двумя местами.
export async function verifyAdminSession(token: string): Promise<SessionPayload | null> {
  const session = await verifySession(token);
  if (!session) {
    return null;
  }

  const currentSessionVersion = await getAdminSessionVersion(session.adminId);
  if (currentSessionVersion === null || currentSessionVersion !== session.sessionVersion) {
    return null;
  }

  return session;
}

// Дешёвая защита в глубину (architecture.md §3.4, п.2) — вызывается в начале КАЖДОГО админского
// Server Action, не полагается на то, что proxy.ts уже отсеял неавторизованный вызов на уровне
// рендера страницы. Бросает при отсутствии/невалидности/просроченности сессии — это ожидаемо
// нештатный путь (proxy.ts должен был отсечь раньше), не часть обычного потока управления.
export async function requireAdminSession(): Promise<SessionPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    throw new Error('requireAdminSession: no session cookie');
  }

  const session = await verifyAdminSession(token);
  if (!session) {
    throw new Error('requireAdminSession: invalid, expired, or superseded session');
  }

  return session;
}
