const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');

// Mock environment for testing
process.env.NODE_ENV = 'test';

describe('API Endpoints', () => {
  beforeAll(async () => {
    // Connect to test database
    const testDbUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/pinquest-test';
    await mongoose.connect(testDbUrl);
  });

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({ email: /test@example.com$/ }); // Clean up test users
    await mongoose.connection.close();
  });

  describe('Health Check Endpoints', () => {
    test('should return health status', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('should return liveness status', async () => {
      const response = await request(app).get('/api/v1/health/live');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('alive');
    });

    test('should return readiness status', async () => {
      const response = await request(app).get('/api/v1/health/ready');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
    });
  });

  describe('Authentication Endpoints', () => {
    test('should return 400 for registration without required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('fail');
    });

    test('should return 400 for login without required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('fail');
    });
  });
});