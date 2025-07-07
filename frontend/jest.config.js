const nextJest = require('next/jest')

const createJestConfig = nextJest({ dir: './' })

const customConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
}

module.exports = createJestConfig(customConfig)
