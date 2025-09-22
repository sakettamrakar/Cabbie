import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
  testTimeout: 15000,
  verbose: true,
  testMatch: ['**/?(*.)+(test).[tj]s?(x)'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/',
    '/tests/.*\\.js$',
    '/tests/bookingFlow.test.ts$',
  ],
  collectCoverageFrom: [
    'pages/api/**/*.ts',
    'lib/**/*.ts',
    'components/**/*.tsx',
    '!**/node_modules/**',
  ],
};
export default config;
