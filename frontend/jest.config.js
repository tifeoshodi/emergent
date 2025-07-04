const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: './' });

const customConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: [
    '/node_modules/(?!(isows|@supabase)/)'
  ]
};

module.exports = createJestConfig(customConfig);
