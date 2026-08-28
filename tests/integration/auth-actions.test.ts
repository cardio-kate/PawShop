import crypto from 'node:crypto';
import {
  createMockCookieJar,
  createMockHeaders,
  MockRedirectSignal,
  mockRedirectImpl,
} from '@/tests/helpers/mock-next-request-apis';

const mockCookies = jest.fn();
const mockHeaders = jest.fn();
jest.mock('next/headers', () => ({ cookies: () => mockCookies(), headers: () => mockHeaders() }));

const mockRedirect = jest.fn(mockRedirectImpl);
jest.mock('next/navigation', () => ({ redirect: (url: string) => mockRedirect(url) }));

jest.mock('@/lib/telegram'); // CLAUDE.md → «Тесты»

import { resetDb } from '@/tests/helpers/reset-db';
import { buildAdmin } from '@/tests/helpers/factories';
import { adminLogin, requestPasswordReset, resetPassword } from '@/actions/auth.actions';
import { comparePassword, verifyAdminSession, signSession } from '@/lib/auth';
import { getAdminByUsername } from '@/lib/db/queries/admin.queries';
import * as telegram from '@/lib/telegram';
import { ADMIN_SESSION_COOKIE, MAX_FAILED_LOGIN_ATTEMPTS, RATE_LIMIT_MAX_REQUESTS } from '@/lib/constants';

const mockedTelegram = jest.mocked(telegram);

let ipCounter = 0;
function setFreshClientIp() {
  ipCounter += 1;
  mockHeaders.mockResolvedValue(createMockHeaders({ 'x-forwarded-for': `198.51.100.${100 + ipCounter}` }));
}

beforeEach(async () => {
  await resetDb();
  jest.clearAllMocks();
  setFreshClientIp();
});

// docs/architecture.md §7: happy path adminLogin/resetPassword — Integration, actions/*.ts, MVP.
describe('actions/auth.actions.adminLogin', () => {
  it('sets the session cookie and redirects to the dashboard on a correct password', async () => {
    const jar = createMockCookieJar();
    mockCookies.mockResolvedValue(jar);
    await buildAdmin({ username: 'manager', password: 'correct password' });

    await expect(adminLogin({ username: 'manager', password: 'correct password' })).rejects.toThrow(
      MockRedirectSignal,
    );

    expect(mockRedirect).toHaveBeenCalledWith('/nine-lives/dashboard/products');
    const cookie = jar.get(ADMIN_SESSION_COOKIE);
    expect(cookie).toBeDefined();
    const session = await verifyAdminSession(cookie!.value);
    expect(session).not.toBeNull();
  });

  it('returns the same error message for a wrong password as for an unknown username', async () => {
    await buildAdmin({ username: 'manager', password: 'correct password' });

    const wrongPassword = await adminLogin({ username: 'manager', password: 'wrong' });
    const unknownUser = await adminLogin({ username: 'nobody', password: 'irrelevant' });

    expect(wrongPassword).toEqual(unknownUser);
    expect(wrongPassword).toEqual({ success: false, errors: { root: 'Invalid username or password.' } });
  });

  it('locks the account after MAX_FAILED_LOGIN_ATTEMPTS and rejects even the correct password until it expires', async () => {
    await buildAdmin({ username: 'manager', password: 'correct password' });

    for (let i = 0; i < MAX_FAILED_LOGIN_ATTEMPTS; i++) {
      await adminLogin({ username: 'manager', password: 'wrong' });
    }
    const result = await adminLogin({ username: 'manager', password: 'correct password' });

    expect(result).toEqual({
      success: false,
      errors: { root: 'Too many failed attempts. Try again in 15 minutes.' },
    });
  });
});

describe('actions/auth.actions.requestPasswordReset', () => {
  it('sends a Telegram code and stores only its sha256 hash, never the raw token', async () => {
    await buildAdmin({ username: 'manager', telegramChatId: '999' });

    const result = await requestPasswordReset({ username: 'manager' });

    expect(result).toEqual({ success: true, data: null });
    expect(mockedTelegram.sendResetCode).toHaveBeenCalledTimes(1);
    const [chatId, rawToken] = mockedTelegram.sendResetCode.mock.calls[0]!;
    expect(chatId).toBe('999');

    const adminRow = await getAdminByUsername('manager');
    expect(adminRow!.resetTokenHash).toBe(crypto.createHash('sha256').update(rawToken).digest('hex'));
    expect(adminRow!.resetTokenHash).not.toBe(rawToken);
  });

  it('still returns success for an unknown username, without sending anything', async () => {
    const result = await requestPasswordReset({ username: 'nobody' });

    expect(result).toEqual({ success: true, data: null });
    expect(mockedTelegram.sendResetCode).not.toHaveBeenCalled();
  });

  it('blocks requestPasswordReset once the shared per-IP budget is exhausted', async () => {
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      await requestPasswordReset({ username: 'nobody' });
    }

    const blocked = await requestPasswordReset({ username: 'nobody' });

    expect(blocked).toEqual({
      success: false,
      errors: { root: 'Too many attempts. Please try again later.' },
    });
  });
});

describe('actions/auth.actions.resetPassword', () => {
  it('changes the password and invalidates previously issued sessions via sessionVersion', async () => {
    const admin = await buildAdmin({ username: 'manager', telegramChatId: '999' });
    const oldToken = await signSession({ adminId: admin.id, sessionVersion: admin.sessionVersion });
    expect(await verifyAdminSession(oldToken)).not.toBeNull(); // sanity check before reset

    await requestPasswordReset({ username: 'manager' });
    const [, rawToken] = mockedTelegram.sendResetCode.mock.calls[0]!;

    const result = await resetPassword({ code: rawToken, newPassword: 'brand new password' });

    expect(result).toEqual({ success: true, data: null });

    // Старый токен (та же подпись, старый sessionVersion) больше не проходит...
    expect(await verifyAdminSession(oldToken)).toBeNull();

    const adminRow = await getAdminByUsername('manager');
    expect(await comparePassword('brand new password', adminRow!.passwordHash)).toBe(true);
    // ...а новый, подписанный текущим sessionVersion из БД, проходит.
    const newToken = await signSession({ adminId: admin.id, sessionVersion: adminRow!.sessionVersion });
    expect(await verifyAdminSession(newToken)).not.toBeNull();
  });

  it('rejects a token past its TTL, checked at use time', async () => {
    const rawToken = 'a-known-raw-token-for-this-test';
    const resetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await buildAdmin({
      username: 'manager',
      resetTokenHash,
      resetTokenExpiresAt: new Date(Date.now() - 1_000),
    });

    const result = await resetPassword({ code: rawToken, newPassword: 'brand new password' });

    expect(result).toEqual({
      success: false,
      errors: { root: 'This reset code is invalid or has expired.' },
    });
  });

  it('rejects a token that does not match any stored resetTokenHash', async () => {
    await buildAdmin({ username: 'manager' });

    const result = await resetPassword({ code: 'never-issued-token', newPassword: 'brand new password' });

    expect(result).toEqual({
      success: false,
      errors: { root: 'This reset code is invalid or has expired.' },
    });
  });
});
