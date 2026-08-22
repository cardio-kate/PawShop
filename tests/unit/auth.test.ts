// requireAdminSession() сознательно не тестируется здесь — завязан на next/headers cookies() и
// admin.queries.ts (БД); его integration-тест появляется вместе с первым admin action, который его
// вызывает (adminLogout(), см. .claude/plans/backend-realization-pawshop.md, Фаза 1).

// lib/auth.ts держит requireAdminSession() в одном файле с чистыми signSession/verifySession/
// hashPassword/comparePassword, которые тестирует именно этот файл (architecture.md §3.4) — импорт
// модуля всё равно тянет lib/db/index.ts, который на уровне модуля сразу строит Neon-клиент, поэтому
// env-переменные должны быть выставлены ДО импорта. Статический `import` хостится трансформом выше
// этих присвоений (та же причина, по которой tests/integration/reset-db-guard.test.ts использует
// динамический import) — здесь lib/auth поэтому грузится лениво внутри beforeAll.
let signSession: typeof import('@/lib/auth').signSession;
let verifySession: typeof import('@/lib/auth').verifySession;
let hashPassword: typeof import('@/lib/auth').hashPassword;
let comparePassword: typeof import('@/lib/auth').comparePassword;

beforeAll(async () => {
  process.env.JWT_SECRET = 'unit-test-secret-do-not-use-in-prod';
  process.env.JWT_EXPIRES_IN = '7d';
  // Синтаксически валидного плейсхолдера достаточно: этот набор тестов ни разу не идёт в БД.
  process.env.DATABASE_URL = 'postgresql://unit-test-placeholder@localhost/db';
  ({ signSession, verifySession, hashPassword, comparePassword } = await import('@/lib/auth'));
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
