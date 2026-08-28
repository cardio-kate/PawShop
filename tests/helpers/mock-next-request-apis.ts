// next/headers (cookies()/headers()) и next/navigation (redirect()) требуют реального request-scope
// (AsyncLocalStorage), которого нет при вызове Server Action напрямую из Jest — actions/*.ts в
// integration-тестах вызываются как обычные async-функции, не через настоящий HTTP-запрос Next.
// Каждый integration-тест-файл, которому это нужно, сам делает `jest.mock('next/headers', ...)`/
// `jest.mock('next/navigation', ...)` (jest.mock хостится и должен остаться в файле теста, его
// нельзя вынести в общий helper) и использует эти билдеры внутри фабрики/значений мока — так форма
// объектов не дублируется в каждом файле по отдельности.

export interface MockCookieJar {
  get(name: string): { name: string; value: string } | undefined;
  set(name: string, value: string, options?: unknown): void;
  delete(name: string): void;
}

// initial — cookie, "уже лежащий в браузере" на момент вызова (например, валидная admin-сессия);
// set()/delete() дальше мутируют тот же Map, так что adminLogin/adminLogout в тесте можно проверить
// и по итоговому состоянию jar'а.
export function createMockCookieJar(initial: Record<string, string> = {}): MockCookieJar {
  const store = new Map(Object.entries(initial));
  return {
    get: (name) => (store.has(name) ? { name, value: store.get(name)! } : undefined),
    set: (name, value) => {
      store.set(name, value);
    },
    delete: (name) => {
      store.delete(name);
    },
  };
}

// x-forwarded-for — единственный заголовок, который реально читает lib/rate-limit.ts.
export function createMockHeaders(entries: Record<string, string> = {}): Headers {
  return new Headers(entries);
}

// next/navigation.redirect() в реальном Next всегда бросает (никогда не возвращается нормально) —
// мок повторяет этот контракт, чтобы код после вызова (которого в actions после redirect() и так
// нет) не мог случайно продолжить выполняться в тесте иначе, чем в проде.
export class MockRedirectSignal extends Error {
  constructor(public readonly url: string) {
    super(`REDIRECT:${url}`);
  }
}

export function mockRedirectImpl(url: string): never {
  throw new MockRedirectSignal(url);
}
