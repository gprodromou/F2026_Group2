module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/jest.setup.cjs'],
  setupFilesAfterEnv: ['<rootDir>/jest.setupAfterEnv.cjs'],
  testMatch: [
    '<rootDir>/src/tests/**/*.test.{js,jsx}',
    '<rootDir>/src/tests/**/*Test.jsx',
  ],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/styleMock.cjs',
  },
};