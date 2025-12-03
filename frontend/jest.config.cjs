module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx|mjs|cjs|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@testing-library)/)',
  ],
  moduleFileExtensions: ['js', 'jsx', 'json', 'node', 'mjs'],
};
