// Load environment variables for testing
require("dotenv").config();

// Set test environment
process.env.NODE_ENV = "test";

// Mock environment variables if not set
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test-jwt-secret-key-for-testing";
}

if (!process.env.MONGODB_URI && !process.env.MONGODB_URI_TEST) {
  console.warn("⚠️  Warning: No test database URI found. Tests may fail.");
}

// Increase timeout for database operations
jest.setTimeout(10000);

// Global test utilities
global.testUtils = {
  // Helper to create valid MongoDB ObjectId
  createObjectId: () => {
    const mongoose = require("mongoose");
    return new mongoose.Types.ObjectId();
  },

  // Helper to wait for async operations
  wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

// Suppress console logs during tests (optional)
if (process.env.SUPPRESS_TEST_LOGS === "true") {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}
