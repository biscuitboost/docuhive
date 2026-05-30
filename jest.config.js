const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'components/marketing/Pricing.tsx',
    'components/billing/PricingTable.tsx',
  ],
  coverageThreshold: {
    './components/marketing/Pricing.tsx': {
      branches: 45,
      functions: 45,
      lines: 45,
      statements: 45,
    },
  },
}

module.exports = createJestConfig(config)
