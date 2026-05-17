export default {
  moduleNameMapper: {
    '^.+\\.(scss)$': '<rootDir>/tests/empty.ts',
    '^.+\\.(css)$': '<rootDir>/tests/empty.ts',
    '^.+\\.(png)$': '<rootDir>/tests/empty.ts'
  },
  setupFilesAfterEnv: [
    './jest.setup.ts'
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!openlayers)/'
  ],
  testEnvironment: 'jsdom',
  testMatch: [
    '**/*.jest.[jt]s?(x)'
  ]
};
