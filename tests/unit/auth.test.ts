// lib/auth.ts держит requireAdminSession() в одном файле с чистыми signSession/verifySession/
// hashPassword/comparePassword, которые тестирует именно этот файл (architecture.md §3.4) — импорт
// модуля всё равно тянет lib/db/index.ts, который на уровне модуля сразу строит Neon-клиент, поэтому
// env-переменные должны быть выставлены ДО импорта. Статический `import` хостится трансформом выше
// этих присвоений (та же причина, по которой tests/integration/reset-db-guard.test.ts использует
// динамический import) — здесь lib/auth поэтому грузится лениво внутри beforeAll.
//
// verifyAdminSession/requireAdminSession читают sessionVersion из admin.queries.ts (БД) и cookie из
// next/headers — оба мокаются здесь тем же приёмом, что и admin.queries в auth-service.test.ts, чтобы
// проверить саму логику сравнения (совпадает/не совпадает/админа больше нет) без реального Postgres.
// Реальный round-trip через настоящую БД остаётся за integration-тестами (architecture.md §7, таблица).
jest.mock('@/lib/db/queries/admin.queries', () => ({
  getAdminSessionVersion: jest.fn(),
}));
jest.mock('next/headers', () => ({ cookies: jest.fn() }));

let signSession: typeof import('@/lib/auth').signSession;
let verifySession: typeof import('@/lib/auth').verifySession;
let verifyAdminSession: typeof import('@/lib/auth').verifyAdminSession;
let requireAdminSession: typeof import('@/lib/auth').requireAdminSession;
let hashPassword: typeof import('@/lib/auth').hashPassword;
let comparePassword: typeof import('@/lib/auth').comparePassword;
let adminQueries: jest.Mocked<typeof import('@/lib/db/queries/admin.queries')>;
let cookies: jest.MockedFunction<typeof import('next/headers').cookies>;
let ADMIN_SESSION_COOKIE: string;

beforeAll(async () => {
  process.env.JWT_SECRET = 'unit-test-secret-do-not-use-in-prod';
  process.env.JWT_EXPIRES_IN = '7d';
  // Синтаксически валидного плейсхолдера достаточно: этот набор тестов ни разу не идёт в БД.
  process.env.DATABASE_URL = 'postgresql://unit-test-placeholder@localhost/db';
  ({ signSession, verifySession, verifyAdminSession, requireAdminSession, hashPassword, comparePassword } =
    await import('@/lib/auth'));
  ({ ADMIN_SESSION_COOKIE } = await import('@/lib/constants'));
  adminQueries = jest.requireMock('@/lib/db/queries/admin.queries');
  ({ cookies } = jest.requireMock('next/headers'));
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('lib/auth session', () => {
  it('round-trips a valid payload through sign and verify', async () => {
    const token = await signSession({ adminId: 1, sessionVersion: 0 });
    const session = await verifySession(token);
    expect(session).toEqual({ adminId: 1, sessionVersion: 0 });
  });

  it('returns null for a garbage token instead of throwing', async () => {
    await expect(verifySession('not-a-jwt')).resolves.toBeNull();
  });

  it('returns null when the signature does not match the secret', async () => {
    const token = await signSession({ adminId: 1, sessionVersion: 0 });
    const tamperedSignature = token.slice(0, -4) + 'AAAA';
    await expect(verifySession(tamperedSignature)).resolves.toBeNull();
  });

  it('returns null for an already-expired token', async () => {
    const { SignJWT } = await import('jose');
    const expired = await new SignJWT({ adminId: 1, sessionVersion: 0 })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 120)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));
    await expect(verifySession(expired)).resolves.toBeNull();
  });
});

describe('lib/auth verifyAdminSession', () => {
  it('returns the session when the JWT sessionVersion matches the DB value', async () => {
    const token = await signSession({ adminId: 1, sessionVersion: 3 });
    adminQueries.getAdminSessionVersion.mockResolvedValue(3);

    await expect(verifyAdminSession(token)).resolves.toEqual({ adminId: 1, sessionVersion: 3 });
  });

  // Регрессия на баг, где resetPassword не сбрасывал lockedUntil: этот тест проверяет соседнюю, но
  // отдельную гарантию — что токен, выданный ДО сброса пароля, действительно перестаёт проходить
  // verifyAdminSession ПОСЛЕ того, как sessionVersion в БД увеличился (architecture.md §3.4).
  it('returns null for a token whose sessionVersion is stale after a password reset', async () => {
    const oldToken = await signSession({ adminId: 1, sessionVersion: 0 });
    adminQueries.getAdminSessionVersion.mockResolvedValue(1);

    await expect(verifyAdminSession(oldToken)).resolves.toBeNull();
  });

  it('returns null when the admin row no longer exists', async () => {
    const token = await signSession({ adminId: 1, sessionVersion: 0 });
    adminQueries.getAdminSessionVersion.mockResolvedValue(null);

    await expect(verifyAdminSession(token)).resolves.toBeNull();
  });

  it('does not query the DB for a token that fails JWT verification on its own', async () => {
    await expect(verifyAdminSession('not-a-jwt')).resolves.toBeNull();
    expect(adminQueries.getAdminSessionVersion).not.toHaveBeenCalled();
  });
});

describe('lib/auth requireAdminSession', () => {
  it('throws when there is no session cookie', async () => {
    cookies.mockResolvedValue({ get: () => undefined } as never);

    await expect(requireAdminSession()).rejects.toThrow(/no session cookie/);
  });

  it('throws when the cookie holds an invalid token', async () => {
    cookies.mockResolvedValue({
      get: () => ({ name: ADMIN_SESSION_COOKIE, value: 'not-a-jwt' }),
    } as never);

    await expect(requireAdminSession()).rejects.toThrow(/invalid, expired, or superseded/);
  });

  // Ровно сценарий из adminLogout() (единственный admin action Фазы 1, architecture.md §7 таблица,
  // "requireAdminSession() отклоняет вызов ... в каждом admin action"): cookie синтаксически валиден,
  // но sessionVersion внутри него устарел относительно БД.
  it('throws when the cookie holds a token with a stale sessionVersion', async () => {
    const staleToken = await signSession({ adminId: 1, sessionVersion: 0 });
    adminQueries.getAdminSessionVersion.mockResolvedValue(1);
    cookies.mockResolvedValue({
      get: () => ({ name: ADMIN_SESSION_COOKIE, value: staleToken }),
    } as never);

    await expect(requireAdminSession()).rejects.toThrow(/invalid, expired, or superseded/);
  });

  it('returns the session payload for a valid, current token', async () => {
    const token = await signSession({ adminId: 1, sessionVersion: 2 });
    adminQueries.getAdminSessionVersion.mockResolvedValue(2);
    cookies.mockResolvedValue({
      get: () => ({ name: ADMIN_SESSION_COOKIE, value: token }),
    } as never);

    await expect(requireAdminSession()).resolves.toEqual({ adminId: 1, sessionVersion: 2 });
  });
});

describe('lib/auth password hashing', () => {
  it('hashes a password so it does not equal the plaintext', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(hash).not.toBe('correct horse battery staple');
  });

  it('accepts the correct password against its own hash', async () => {
    const hash = await hashPassword('correct horse battery staple');
    await expect(comparePassword('correct horse battery staple', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password against an existing hash', async () => {
    const hash = await hashPassword('correct horse battery staple');
    await expect(comparePassword('wrong password', hash)).resolves.toBe(false);
  });
});
