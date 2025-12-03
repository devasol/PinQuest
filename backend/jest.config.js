{
  "testEnvironment": "node",
  "collectCoverageFrom": [
    "controllers/**/*.js",
    "models/**/*.js",
    "middleware/**/*.js",
    "routes/**/*.js",
    "utils/**/*.js",
    "!**/node_modules/**",
    "!**/vendor/**"
  ],
  "coverageReporters": [
    "text",
    "lcov",
    "html"
  ],
  "testTimeout": 15000,
  "setupFilesAfterEnv": ["<rootDir>/__tests__/setup.js"]
}