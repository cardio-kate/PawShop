import crypto from 'node:crypto';

// lib/services/auth.service.ts вызывает admin.queries.ts (БД) и lib/telegram.ts (сеть) напрямую —
// это юнит-тест бизнес-правил самого сервиса, не integration-тест против реальной БД, поэтому обе
// зависимости мокаются (lib/telegram.ts — всегда, на обоих уровнях тестов, CLAUDE.md → «Тесты»).
// Автомок без фабрики сначала реально требует оригинальный модуль, чтобы узнать его экспорты — а
// admin.queries.ts тянет lib/db/index.ts, который на уровне модуля сразу строит neon()-клиент и
// падает без DATABASE_URL. Явная фабрика не даёт настоящему модулю вообще загрузиться.
jest.mock('@/lib/db/queries/admin.queries', () => ({
  getAdminSessionVersion: jest.fn(),
  getAdminByUsername: jest.fn(),
  getAdminByResetTokenHash: jest.fn(),
  recordFailedLoginAttempt: jest.fn(),
  resetFailedLoginAttempts: jest.fn(),
  setResetToken: jest.fn(),
  resetPasswordAndInvalidateSessions: jest.fn(),
}));
jest.mock('@/lib/telegram');
// Фаза 4 (REV2): requestPasswordReset ретроактивно зовёт checkRateLimit() — lib/rate-limit.ts тянет
// lib/db/index.ts (neon() на уровне модуля), которого без DATABASE_URL нет в CI unit-джобе (CLAUDE.md
// → «Тесты»: test:unit — без секретов, без БД). Мокается тем же приёмом, что admin.queries.ts выше —
// явная фабрика не даёт настоящему lib/rate-limit.ts вообще загрузиться. Ни один тест ниже не проверяет
// сам rate-limit (это integration-сценарий, см. architecture.md §7) — checkRateLimit по умолчанию
// разрешает запрос, чтобы остальная логика requestPasswordReset тестировалась как раньше.
jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn(),
}));

type AdminQueriesModule = typeof import('@/lib/db/queries/admin.queries');
type TelegramModule = typeof import('@/lib/telegram');
type RateLimitModule = typeof import('@/lib/rate-limit');
type AuthServiceModule = typeof import('@/lib/services/auth.service');

let adminQueries: jest.Mocked<AdminQueriesModule>;
let telegram: jest.Mocked<TelegramModule>;
let rateLimit: jest.Mocked<RateLimitModule>;
let authService: AuthServiceModule;

const BASE_ADMIN_ROW = {
  id: 1,
  username: 'manager',
  passwordHash: '',
  telegramChatId: '123456789',
  resetTokenHash: null as string | null,
  resetTokenExpiresAt: null as Date | null,
  failedLoginAttempts: 0,
  lockedUntil: null as Date | null,
  sessionVersion: 0,
};

beforeAll(async () => {
  // Env читается лениво внутри lib/auth.ts (см. Фазу 1) — но статический import всё равно
  // хостится над этими присвоениями, поэтому модуль под тестом грузится динамически в beforeAll,
  // тем же приёмом, что и tests/unit/auth.test.ts.
  process.env.JWT_SECRET = 'unit-test-secret-do-not-use-in-prod';
  process.env.JWT_EXPIRES_IN = '7d';

  adminQueries = jest.requireMock('@/lib/db/queries/admin.queries');
  telegram = jest.requireMock('@/lib/telegram');
  rateLimit = jest.requireMock('@/lib/rate-limit');
  authService = await import('@/lib/services/auth.service');
});

beforeEach(() => {
  jest.clearAllMocks();
  // clearAllMocks() выше сбрасывает вызовы/результаты, но не implementation — тем не менее
  // переустанавливается на каждый тест явно (не полагаясь на этот нюанс): ни один тест в файле не
  // проверяет сам rate-limit (integration-сценарий, architecture.md §7), всем остальным нужен
  // предсказуемый "разрешено" по умолчанию.
  rateLimit.checkRateLimit.mockResolvedValue({ allowed: true });
});

describe('auth.service.login', () => {
  it('returns invalid_credentials when the username does not exist, without touching lockouts', async () => {
    adminQueries.getAdminByUsername.mockResolvedValue(null);

    const result = await authService.login('nobody', 'irrelevant');

    expect(result).toEqual({ success: false, error: 'invalid_credentials' });
    expect(adminQueries.recordFailedLoginAttempt).not.toHaveBeenCalled();
  });

  it('returns locked without checking the password when lockedUntil is in the future', async () => {
    adminQueries.getAdminByUsername.mockResolvedValue({
      ...BASE_ADMIN_ROW,
      lockedUntil: new Date(Date.now() + 5 * 60_000),
    });

    const result = await authService.login('manager', 'anything');

    expect(result).toEqual({ success: false, error: 'locked' });
    expect(adminQueries.recordFailedLoginAttempt).not.toHaveBeenCalled();
  });

  it('treats an expired lockedUntil as no longer locked', async () => {
    const { hashPassword } = await import('@/lib/auth');
    const passwordHash = await hashPassword('correct password');
    adminQueries.getAdminByUsername.mockResolvedValue({
      ...BASE_ADMIN_ROW,
      passwordHash,
      lockedUntil: new Date(Date.now() - 60_000),
    });

    const result = await authService.login('manager', 'correct password');

    expect(result.success).toBe(true);
  });

  it('records a failed attempt on a wrong password and does not sign a session', async () => {
    const { hashPassword } = await import('@/lib/auth');
    const passwordHash = await hashPassword('correct password');
    adminQueries.getAdminByUsername.mockResolvedValue({ ...BASE_ADMIN_ROW, passwordHash });
    adminQueries.recordFailedLoginAttempt.mockResolvedValue({
      failedLoginAttempts: 1,
      lockedUntil: null,
    });

    const result = await authService.login('manager', 'wrong password');

    expect(result).toEqual({ success: false, error: 'invalid_credentials' });
    expect(adminQueries.recordFailedLoginAttempt).toHaveBeenCalledWith(1, 5, 15);
    expect(adminQueries.resetFailedLoginAttempts).not.toHaveBeenCalled();
  });

  it('resets the attempt counter and signs a session on a correct password', async () => {
    const { hashPassword } = await import('@/lib/auth');
    const passwordHash = await hashPassword('correct password');
    adminQueries.getAdminByUsername.mockResolvedValue({
      ...BASE_ADMIN_ROW,
      passwordHash,
      sessionVersion: 3,
    });

    const result = await authService.login('manager', 'correct password');

    expect(result.success).toBe(true);
    expect(adminQueries.resetFailedLoginAttempts).toHaveBeenCalledWith(1);
    if (result.success) {
      const { verifySession } = await import('@/lib/auth');
      await expect(verifySession(result.token)).resolves.toEqual({
        adminId: 1,
        sessionVersion: 3,
      });
    }
  });
});

describe('auth.service.requestPasswordReset', () => {
  it('returns success without generating a token when the username does not exist', async () => {
    adminQueries.getAdminByUsername.mockResolvedValue(null);

    const result = await authService.requestPasswordReset('nobody');

    expect(result).toEqual({ success: true });
    expect(adminQueries.setResetToken).not.toHaveBeenCalled();
    expect(telegram.sendResetCode).not.toHaveBeenCalled();
  });

  it('stores the sha256 hash of the raw token sent to Telegram, not the raw token itself', async () => {
    adminQueries.getAdminByUsername.mockResolvedValue(BASE_ADMIN_ROW);

    await authService.requestPasswordReset('manager');

    expect(telegram.sendResetCode).toHaveBeenCalledTimes(1);
    const [chatId, rawToken] = telegram.sendResetCode.mock.calls[0]!;
    expect(chatId).toBe('123456789');

    expect(adminQueries.setResetToken).toHaveBeenCalledTimes(1);
    const [, storedHash] = adminQueries.setResetToken.mock.calls[0]!;
    expect(storedHash).toBe(crypto.createHash('sha256').update(rawToken).digest('hex'));
    expect(storedHash).not.toBe(rawToken);
  });

  it('still returns success and does not throw when Admin.telegramChatId is null', async () => {
    adminQueries.getAdminByUsername.mockResolvedValue({
      ...BASE_ADMIN_ROW,
      telegramChatId: null,
    });

    const result = await authService.requestPasswordReset('manager');

    expect(result).toEqual({ success: true });
    expect(telegram.sendResetCode).not.toHaveBeenCalled();
  });

  it('still returns success when the Telegram API call itself fails', async () => {
    adminQueries.getAdminByUsername.mockResolvedValue(BASE_ADMIN_ROW);
    telegram.sendResetCode.mockRejectedValue(new Error('Telegram unreachable'));

    const result = await authService.requestPasswordReset('manager');

    expect(result).toEqual({ success: true });
  });
});

describe('auth.service.resetPassword', () => {
  it('rejects a token that does not match any stored resetTokenHash', async () => {
    adminQueries.getAdminByResetTokenHash.mockResolvedValue(null);

    const result = await authService.resetPassword('some-raw-token', 'new password');

    expect(result).toEqual({ success: false, error: 'invalid_or_expired_token' });
    expect(adminQueries.resetPasswordAndInvalidateSessions).not.toHaveBeenCalled();
  });

  it('rejects a matching token past its TTL, checked at use time, not only at issue time', async () => {
    adminQueries.getAdminByResetTokenHash.mockResolvedValue({
      ...BASE_ADMIN_ROW,
      resetTokenHash: 'irrelevant-because-mocked',
      resetTokenExpiresAt: new Date(Date.now() - 1_000),
    });

    const result = await authService.resetPassword('some-raw-token', 'new password');

    expect(result).toEqual({ success: false, error: 'invalid_or_expired_token' });
    expect(adminQueries.resetPasswordAndInvalidateSessions).not.toHaveBeenCalled();
  });

  it('hashes the new password and invalidates sessions on a valid, unexpired token', async () => {
    adminQueries.getAdminByResetTokenHash.mockResolvedValue({
      ...BASE_ADMIN_ROW,
      resetTokenHash: 'irrelevant-because-mocked',
      resetTokenExpiresAt: new Date(Date.now() + 5 * 60_000),
    });

    const result = await authService.resetPassword('some-raw-token', 'new password');

    expect(result).toEqual({ success: true });
    expect(adminQueries.resetPasswordAndInvalidateSessions).toHaveBeenCalledTimes(1);
    const [id, storedHash] = adminQueries.resetPasswordAndInvalidateSessions.mock.calls[0]!;
    expect(id).toBe(1);
    expect(storedHash).not.toBe('new password');
    const { comparePassword } = await import('@/lib/auth');
    await expect(comparePassword('new password', storedHash)).resolves.toBe(true);
  });
});
