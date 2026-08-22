const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  displayName: 'unit',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  // `output: 'standalone'` копирует package.json в .next/standalone — без этого Haste-карта модулей
  // Jest видит два пакета "pawshop" и предупреждает при каждом прогоне после любого локального билда.
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
  // SWC-трансформ next/jest переписывает алиас `@/*` из tsconfig только внутри статических `import` —
  // строковые аргументы вроде `jest.mock('@/lib/...')` не трогает, а собственного moduleNameMapper
  // под этот алиас next/jest не создаёт (проверено через --showConfig). Без этой строки любой
  // jest.mock('@/...') в тесте сервиса падает с "Cannot find module".
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
};

module.exports = createJestConfig(config);
