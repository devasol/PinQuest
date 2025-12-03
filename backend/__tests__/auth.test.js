const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Mock environment for testing
process.env.NODE_ENV = 'test';

describe('Authentication Endpoints', () => {
  beforeAll(async () => {
    // Connect to test database
    const testDbUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/pinquest-test';
    await mongoose.connect(testDbUrl);
  });

  beforeEach(async () => {
    // Clean up any existing test users
    await User.deleteMany({ email: /test@example.com$/ });
  });

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({ email: /test@example.com$/ });
    await mongoose.connection.close();
  });

  describe('User Registration', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.email).toBe(userData.email);
    });

    test('should return error for duplicate email', async () => {
      // First registration
      const userData = {
        name: 'Test User',
        email: 'duplicate@example.com',
        password: 'password123'
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      // Second registration with same email
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('fail');
    });

    test('should return error for missing fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('User Login', () => {
    test('should login existing user successfully', async () => {
      // Create a test user first
      const hashedPassword = await bcrypt.hash('password123', 12);
      const user = new User({
        name: 'Test User',
        email: 'login@example.com',
        password: hashedPassword,
        isVerified: true
      });
      await user.save();

      const loginData = {
        email: 'login@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('token');
    });

    test('should return error for invalid credentials', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('fail');
    });
  });
});