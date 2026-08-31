import { createMockHeaders } from '@/tests/helpers/mock-next-request-apis';

// submitContactMessage (public action) → contact.service.submitContactMessage → lib/rate-limit.
// checkRateLimit() reads next/headers.headers() — needs mocking outside a real request scope
// (docs/architecture.md §7), same as orders-actions.test.ts/auth-actions.test.ts.
const mockHeaders = jest.fn();
jest.mock('next/headers', () => ({ headers: () => mockHeaders() }));

// CLAUDE.md → «Тесты»: lib/telegram.ts всегда jest.mock, на обоих уровнях — тест не имеет права
// стучаться в реальный Telegram API.
jest.mock('@/lib/telegram');

import { resetDb } from '@/tests/helpers/reset-db';
import { buildAdmin } from '@/tests/helpers/factories';
import { submitContactMessage } from '@/actions/contact.actions';
import { getAdminContactMessages } from '@/lib/db/queries/contact.queries';
import * as telegram from '@/lib/telegram';
import { RATE_LIMIT_MAX_REQUESTS } from '@/lib/constants';

const mockedTelegram = jest.mocked(telegram);

let ipCounter = 0;
function setFreshClientIp() {
  ipCounter += 1;
  mockHeaders.mockResolvedValue(createMockHeaders({ 'x-forwarded-for': `198.51.100.${ipCounter}` }));
}

beforeEach(async () => {
  await resetDb();
  jest.clearAllMocks();
  setFreshClientIp();
});

const VALID_INPUT = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+491234567',
  comment: 'When will the 3kg bag be back in stock?',
};

describe('actions/contact.actions.submitContactMessage — happy path', () => {
  it('persists the message and notifies the configured admin', async () => {
    await buildAdmin({ telegramChatId: '999' });

    const result = await submitContactMessage(VALID_INPUT);

    expect(result.success).toBe(true);
    if (!result.success) return;

    const { messages } = await getAdminContactMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0]!.id).toBe(result.data.id);
    expect(messages[0]!.name).toBe('Jane Doe');
    expect(messages[0]!.email).toBe('jane@example.com');
    expect(messages[0]!.phone).toBe('+491234567');

    expect(mockedTelegram.sendContactNotification).toHaveBeenCalledTimes(1);
    const [chatId, data] = mockedTelegram.sendContactNotification.mock.calls[0]!;
    expect(chatId).toBe('999');
    expect(data.name).toBe('Jane Doe');
  });

  it('does not throw and still persists the message when the Telegram call itself fails', async () => {
    await buildAdmin({ telegramChatId: '999' });
    mockedTelegram.sendContactNotification.mockRejectedValue(new Error('Telegram unreachable'));

    const result = await submitContactMessage(VALID_INPUT);

    expect(result.success).toBe(true);
    const { messages } = await getAdminContactMessages();
    expect(messages).toHaveLength(1);
  });

  it('persists the message without attempting a notification when no admin telegramChatId is set yet', async () => {
    // No buildAdmin() call — admin.queries.getAdminTelegramChatId() has nothing to select.
    const result = await submitContactMessage(VALID_INPUT);

    expect(result.success).toBe(true);
    const { messages } = await getAdminContactMessages();
    expect(messages).toHaveLength(1);
    expect(mockedTelegram.sendContactNotification).not.toHaveBeenCalled();
  });
});

describe('actions/contact.actions.submitContactMessage — validation', () => {
  it('rejects an invalid email without touching the rate limit budget or the database', async () => {
    const result = await submitContactMessage({ ...VALID_INPUT, email: 'not-an-email' });

    expect(result).toEqual({
      success: false,
      errors: { email: 'errors.email.invalid' },
    });

    const { messages } = await getAdminContactMessages();
    expect(messages).toHaveLength(0);
  });
});

describe('actions/contact.actions.submitContactMessage — rate limit', () => {
  it('blocks submitContactMessage once the shared per-IP budget is exhausted', async () => {
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      const result = await submitContactMessage(VALID_INPUT);
      expect(result.success).toBe(true);
    }

    const blocked = await submitContactMessage(VALID_INPUT);

    expect(blocked).toEqual({
      success: false,
      errors: { root: 'errors.rateLimited' },
    });

    const { total } = await getAdminContactMessages();
    expect(total).toBe(RATE_LIMIT_MAX_REQUESTS); // блокированная попытка не создала строку
  });
});
