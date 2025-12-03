// __tests__/setup.js
// Setup file for Jest tests

// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
process.env.MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/pinquest-test';

// Mock any external services that might be used
jest.mock('../utils/email', () => ({
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendNotificationEmail: jest.fn()
}));

// Mock any other services as needed
jest.mock('../utils/mediaUtils', () => ({
  deleteImageFromCloudinary: jest.fn(),
  uploadImageToCloudinary: jest.fn()
}));

console.log('Test environment set up');