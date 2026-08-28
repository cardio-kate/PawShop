import { createMockHeaders } from '@/tests/helpers/mock-next-request-apis';

// lib/rate-limit.ts читает IP через next/headers.headers() — вне реального Next request-scope это
// падает без мока (docs/architecture.md §7). Мокается на уровне файла (jest.mock хостится) —
// значение переустанавливается в каждом тесте через mockResolvedValue.
const mockHeaders = jest.fn();
jest.mock('next/headers', () => ({ headers: () => mockHeaders() }));

import { resetDb } from '@/tests/helpers/reset-db';
import { checkRateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_MAX_REQUESTS } from '@/lib/constants';

function setClientIp(ip: string) {
  mockHeaders.mockResolvedValue(createMockHeaders({ 'x-forwarded-for': ip }));
}

beforeEach(async () => {
  await resetDb();
  jest.clearAllMocks();
});

// docs/architecture.md §3.8/§7: атомарный upsert (ip, windowStart) — не "прочитать → сравнить →
// записать". RATE_LIMIT_MAX_REQUESTS=5 (lib/constants.ts) в текущей конфигурации проекта.
describe('lib/rate-limit.checkRateLimit', () => {
  it('allows up to RATE_LIMIT_MAX_REQUESTS requests from the same IP within the window', async () => {
    setClientIp('203.0.113.10');

    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      const result = await checkRateLimit();
      expect(result).toEqual({ allowed: true });
    }
  });

  it('blocks the request immediately after the threshold from the same IP', async () => {
    setClientIp('203.0.113.11');

    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      await checkRateLimit();
    }
    const result = await checkRateLimit();

    expect(result).toEqual({ allowed: false });
  });

  it('gives independent budgets to different IPs', async () => {
    setClientIp('203.0.113.20');
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      await checkRateLimit();
    }
    expect(await checkRateLimit()).toEqual({ allowed: false }); // IP #1 exhausted

    setClientIp('203.0.113.21');
    expect(await checkRateLimit()).toEqual({ allowed: true }); // IP #2 unaffected
  });

  it('does not lose increments under concurrent requests from the same IP (atomic upsert)', async () => {
    setClientIp('203.0.113.30');

    // Параллельно, не последовательно — наивное "прочитать счётчик → сравнить → записать" в JS
    // потеряло бы часть инкрементов именно в этом сценарии (docs/architecture.md §3.8).
    const results = await Promise.all(
      Array.from({ length: RATE_LIMIT_MAX_REQUESTS + 2 }, () => checkRateLimit()),
    );

    const allowedCount = results.filter((r) => r.allowed).length;
    expect(allowedCount).toBe(RATE_LIMIT_MAX_REQUESTS);
  });
});
