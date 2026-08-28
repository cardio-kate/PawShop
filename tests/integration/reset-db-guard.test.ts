// Гвард в tests/helpers/reset-db.ts — последняя линия защиты перед TRUNCATE реальной БД
// (docs/architecture.md §7.1). Оба случая ниже не должны доходить до попытки подключения к БД —
// поэтому тест быстрый и не требует реально поднятой тестовой ветки.
//
// Сверка идёт с DATABASE_URL_PROD_FOR_GUARD (не "живым" DATABASE_URL) — tests/helpers/
// setup-integration.ts подменяет DATABASE_URL на значение DATABASE_URL_TEST ещё до этого файла,
// чтобы реальные queries/services/actions в остальных integration-тестах ходили в тестовую ветку;
// оригинальный прод-адрес для сравнения сохранён именно под этим именем.
describe('tests/helpers/reset-db guard', () => {
  const originalDatabaseUrlProdForGuard = process.env.DATABASE_URL_PROD_FOR_GUARD;
  const originalDatabaseUrlTest = process.env.DATABASE_URL_TEST;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    process.env.DATABASE_URL_PROD_FOR_GUARD = originalDatabaseUrlProdForGuard;
    process.env.DATABASE_URL_TEST = originalDatabaseUrlTest;
  });

  it('throws when DATABASE_URL_TEST is not set', async () => {
    delete process.env.DATABASE_URL_TEST;
    const { resetDb } = await import('@/tests/helpers/reset-db');
    await expect(resetDb()).rejects.toThrow(/DATABASE_URL_TEST is not set/);
  });

  it('throws when DATABASE_URL_TEST matches the real DATABASE_URL', async () => {
    process.env.DATABASE_URL_PROD_FOR_GUARD = 'postgresql://example-prod';
    process.env.DATABASE_URL_TEST = 'postgresql://example-prod';
    const { resetDb } = await import('@/tests/helpers/reset-db');
    await expect(resetDb()).rejects.toThrow(/matches the real DATABASE_URL/);
  });
});
