const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  displayName: 'integration',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  // Только этот проект грузит .env.test — unit-проект про него не знает вообще (docs/architecture.md §7.1).
  setupFiles: ['<rootDir>/tests/helpers/setup-integration.ts'],
};

module.exports = createJestConfig(config);
