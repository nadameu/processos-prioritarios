/** @type {jest.ProjectConfig} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: { '\\.[jt]sx?': ['ts-jest'] },
  globals: { 'ts-jest': { diagnostics: false } },
};
