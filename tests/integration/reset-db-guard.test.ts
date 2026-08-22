// Гвард в tests/helpers/reset-db.ts — последняя линия защиты перед TRUNCATE реальной БД
// (docs/architecture.md §7.1). Оба случая ниже не должны доходить до попытки подключения к БД —
// поэтому тест быстрый и не требует реально поднятой тестовой ветки.
describe('tests/helpers/reset-db guard', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalDatabaseUrlTest = process.env.DATABASE_URL_TEST;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.DATABASE_URL_TEST = originalDatabaseUrlTest;
  });

  it('throws when DATABASE_URL_TEST is not set', async () => {
    delete process.env.DATABASE_URL_TEST;
    const { resetDb } = await import('@/tests/helpers/reset-db');
    await expect(resetDb()).rejects.toThrow(/DATABASE_URL_TEST is not set/);
  });

  it('throws when DATABASE_URL_TEST matches DATABASE_URL', async () => {
    process.env.DATABASE_URL = 'postgresql://example-prod';
    process.env.DATABASE_URL_TEST = 'postgresql://example-prod';
    const { resetDb } = await import('@/tests/helpers/reset-db');
    await expect(resetDb()).rejects.toThrow(/matches DATABASE_URL/);
  });
});
