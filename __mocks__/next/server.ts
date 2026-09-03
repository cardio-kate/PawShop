// Ручной мок для 'next/server' — тот же механизм и та же причина, что у __mocks__/next/cache.ts
// (Jest подхватывает файлы под __mocks__/ рядом с node_modules автоматически, без jest.mock() в
// каждом файле).
//
// after() (orders.service.ts/contact.service.ts/auth.service.ts — отложенная отправка Telegram-
// уведомления после ответа клиенту, не блокируя checkout/контакт-форму/сброс пароля их сетевым
// round-trip) завязан на тот же request-scoped стор, что unstable_cache: node_modules/next/dist/
// server/after/after.js вызывает workAsyncStorage.getStore()/workUnitAsyncStorage.getStore() и
// бросает "`after` was called outside a request scope", если стора нет — а вне реального next dev/
// build/start (то есть под next/jest) его и не может быть. Мок делает after() прозрачным: вызывает
// колбэк сразу же (синхронно вызывает task(), не дожидаясь его промиса) — internal try/catch внутри
// самого task (см. три сервиса выше) уже гасит отказ отправки, так что unhandled rejection отсюда
// не течёт. proxy.ts использует NextResponse/NextRequest из этого же модуля, но не через тесты,
// поэтому requireActual для всего остального модуля ничего не ломает.
export {};

const actual = jest.requireActual<typeof import('next/server')>('next/server');

module.exports = {
  ...actual,
  after: (task: (() => unknown) | Promise<unknown>) => {
    if (typeof task === 'function') {
      task();
    }
  },
};
