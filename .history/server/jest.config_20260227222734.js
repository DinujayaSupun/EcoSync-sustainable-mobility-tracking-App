module.exports = {
  testEnvironment: "node",
  coveragePathIgnorePatterns: ["/node_modules/"],
  testTimeout: 10000,
  verbose: true,
  collectCoverageFrom: [
    "controllers/**/*.js",
    "middleware/**/*.js",
    "models/**/*.js",
    "!**/node_modules/**",
  ],
  testMatch: ["**/tests/**/*.test.js"],
  setupFilesAfterEnv: ["./tests/setup.js"],
};
