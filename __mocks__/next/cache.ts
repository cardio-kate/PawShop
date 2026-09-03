// Ручной мок для 'next/cache' — Jest подхватывает файлы под __mocks__/ рядом с node_modules
// автоматически для любого require('next/cache') во всех тестовых проектах (jest.unit.config.js/
// jest.integration.config.js), без jest.mock() в каждом файле (аналог обязательного мока
// lib/telegram.ts из CLAUDE.md → «Тесты», но для инфраструктуры самого Next.js, не нашего кода).
//
// Нужен конкретно для unstable_cache: он завязан на request-scoped incrementalCache (AsyncLocalStorage),
// который существует только внутри реального next dev/build/start. Под next/jest (проверено
// эмпирически на products.queries.ts/delivery.queries.ts) настоящая реализация либо падает с
// "Invariant: incrementalCache missing", либо (в файлах с 'use server') резолвится в нерабочий
// объект без функции — оба варианта ломают ЛЮБОЙ тест, просто импортирующий модуль с
// unstable_cache(...) на верхнем уровне (queries-функции оборачиваются при определении, не при
// вызове). Мок делает unstable_cache прозрачным — вызывает обёрнутую функцию напрямую, без кэша:
// ровно то поведение, которое и нужно тестам (свежее чтение после каждой мутации, не протухший кэш).
//
// revalidateTag/revalidatePath/updateTag/refresh — настоящая реализация через requireActual: она уже
// безопасно работает под Jest без мока (products-actions.test.ts/delivery-actions вызывают её
// напрямую в проходящих тестах), подменять там нечего.
export {};

const actual = jest.requireActual<typeof import('next/cache')>('next/cache');

module.exports = {
  ...actual,
  unstable_cache:
    <T extends (...args: never[]) => Promise<unknown>>(fn: T) =>
      fn,
};
