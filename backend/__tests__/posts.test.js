const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/posts');
const bcrypt = require('bcryptjs');

// Mock environment for testing
process.env.NODE_ENV = 'test';

describe('Post Endpoints', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Connect to test database
    const testDbUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/pinquest-test';
    await mongoose.connect(testDbUrl);
  });

  beforeEach(async () => {
    // Clean up test data
    await Post.deleteMany({ title: /Test Post/ });
    await User.deleteMany({ email: /test@example.com$/ });

    // Create a test user and get auth token
    const hashedPassword = await bcrypt.hash('password123', 12);
    testUser = new User({
      name: 'Test User',
      email: 'posttest@example.com',
      password: hashedPassword,
      isVerified: true
    });
    await testUser.save();

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'posttest@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    // Clean up and close connection
    await Post.deleteMany({ title: /Test Post/ });
    await User.deleteMany({ email: /test@example.com$/ });
    await mongoose.connection.close();
  });

  describe('Post Creation and Management', () => {
    test('should create a new post successfully', async () => {
      const postData = {
        title: 'Test Post',
        description: 'This is a test post',
        category: 'general',
        location: {
          latitude: 40.7128,
          longitude: -74.0060
        }
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.title).toBe(postData.title);
    });

    test('should return all published posts', async () => {
      const response = await request(app)
        .get('/api/v1/posts');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBeTruthy();
    });

    test('should return a specific post by ID', async () => {
      // First create a post
      const postData = {
        title: 'Test Post for ID',
        description: 'This is a test post for ID retrieval',
        category: 'general'
      };

      const createResponse = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData);

      const postId = createResponse.body.data._id;

      // Then get the post by ID
      const response = await request(app)
        .get(`/api/v1/posts/${postId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data._id).toBe(postId);
    });
  });

  describe('Post Interactions', () => {
    let testPostId;

    beforeEach(async () => {
      // Create a test post to interact with
      const postData = {
        title: 'Test Post for Interactions',
        description: 'This is a test post for interactions',
        category: 'general'
      };

      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData);

      testPostId = response.body.data._id;
    });

    test('should like a post', async () => {
      const response = await request(app)
        .put(`/api/v1/posts/${testPostId}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('success');
      expect(response.body).toHaveProperty('data');
    });

    test('should add a comment to a post', async () => {
      const commentData = {
        text: 'This is a test comment'
      };

      const response = await request(app)
        .post(`/api/v1/posts/${testPostId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('comment');
    });
  });
});