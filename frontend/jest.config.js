const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });

const customConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
};

module.exports = createJestConfig(customConfig);
