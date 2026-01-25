 module.exports = {
  coverageReporters: ['json-summary', 'lcov', 'text'],
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest'
  },
  // Disable telemetry during testing to avoid polluting analytics
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/test/setup.js'],
  // The root of your source code, typically /src
  // `<rootDir>` is a token Jest substitutes
  roots: ['<rootDir>'],

  // Test spec file resolution pattern
  // Matches parent folder `__tests__` and filename
  // should contain `test` or `spec`.
  testRegex: '((\\.|/)(test|spec))\\.[jt]sx?$',
  // Module file extensions for importing
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testTimeout: 100000,
  collectCoverageFrom: ['src/**'],
  moduleNameMapper: {
    '^nimma/legacy$': '<rootDir>/node_modules/nimma/dist/legacy/cjs/index.js',
    '^nimma/(.*)': '<rootDir>/node_modules/nimma/dist/cjs/$1'
  },
  watchPathIgnorePatterns: ['<rootDir>/node_modules'],
  modulePathIgnorePatterns: [
    '<rootDir>/examples',
    '<rootDir>/test/runtime',
    '<rootDir>/dist',
    '<rootDir>/tmp',
    '<rootDir>/coverage',
    '<rootDir>/website',
    '<rootDir>/mcp-server'
  ],
};
