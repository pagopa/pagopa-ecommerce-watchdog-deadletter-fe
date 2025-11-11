/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type {Config} from 'jest';

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    "^.+.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$": "jest-transform-stub"
  },
  transform: {
    ".+\\.(svg|css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$": "jest-transform-stub"
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testResultsProcessor: "jest-sonar-reporter",
  testPathIgnorePatterns:[
    "/mock/"
  ]
  globals: {
    fetch: globalThis.fetch,
  },
};

export default config;
