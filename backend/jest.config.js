export default {
  preset: null,
  testEnvironment: 'node',
  testMatch: [
    '**/src/**/__tests__/**/*.test.js',
    '**/src/**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/__tests__/**',
    '!src/server.js'
  ],
  moduleFileExtensions: ['js', 'json'],
  testPathIgnorePatterns: ['/node_modules/']
}