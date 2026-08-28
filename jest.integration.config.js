const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  displayName: 'integration',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  // Та же Haste-коллизия, что в jest.unit.config.js (output: 'standalone' → .next/standalone/package.json).
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
  // Тот же пробел с резолвом jest.mock('@/...'), что в jest.unit.config.js.
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  // Только этот проект грузит .env.test — unit-проект про него не знает вообще (docs/architecture.md §7.1).
  setupFiles: ['<rootDir>/tests/helpers/setup-integration.ts'],
};

// Все integration-тесты бьют в одну и ту же физическую тестовую Neon-ветку, и tests/helpers/
// reset-db.ts делает глобальный TRUNCATE всех таблиц в beforeEach каждого файла — с несколькими
// Jest-воркерами (дефолт) TRUNCATE одного файла стирает строки, которые в этот момент использует
// другой файл, выполняющийся параллельно (обнаружено при первом реальном прогоне против тестовой
// ветки: гонка ломала то rate-limit-счётчик, то FK на только что вставленный product). Файлы этого
// проекта обязаны идти строго последовательно.
//
// `maxWorkers` в конфиге ОТДЕЛЬНОГО project'а Jest здесь не работает — в multi-project режиме
// (jest --selectProjects, см. jest.config.js) воркер-пул общий на весь прогон, per-project значение
// молча игнорируется (проверено: с ним гонка воспроизводилась так же, как без него). Единственный
// рабочий способ — флаг --runInBand на самой CLI-команде, поэтому он в package.json → test:integration,
// не здесь.
//
// --forceExit там же — dbPool (lib/db/index.ts, neon-serverless Pool/WebSocket) держит соединение
// открытым между вызовами, как и рассчитано для долгоживущего сервера; тестовый процесс без него
// зависает после последнего теста, использовавшего транзакцию (Jest предупреждает "did not exit one
// second after..."). Пул не закрывается явно (нет teardown-хука, который вызывал бы pool.end() —
// заводить его только ради тестов означало бы протаскивать тестовую заботу в lib/db/index.ts) —
// --forceExit тот же принцип, что и остальная тестовая инфраструктура: обходится вокруг прод-кода,
// не меняет его.

// products.actions.ts (через i18n/routing.ts) импортирует next-intl — чистый ESM-пакет; ни один
// тест раньше не тянул products.actions.ts напрямую, поэтому пробел в транспиляции был не виден.
// Решается не здесь: next/jest строит transformIgnorePatterns из next.config.ts → transpilePackages
// (node_modules/next/dist/build/jest/jest.js) — тот же официальный рычаг, что уже используется для
// 'jose' (та же проблема, тот же файл). Раньше здесь был кастомный async-wrapper, переопределявший
// весь resolved.transformIgnorePatterns целиком — он молча терял дефолтный игнор `.module.(css|
// sass|scss)$`, который next/jest всегда добавляет сама; исправлено в самом next.config.ts вместо
// того, чтобы чинить это здесь второй раз.
module.exports = createJestConfig(config);
