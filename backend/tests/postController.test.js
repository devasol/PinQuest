// backend/tests/postController.test.js
const request = require('supertest');
const express = require('express');
const app = express();

// Mock the database connection
jest.mock('../config/dbConfig', () => jest.fn());

// Import routes
const postsRoute = require('../routes/postsRoute');

app.use(express.json());
app.use('/api/v1/posts', postsRoute);

// Mock the auth middleware
jest.mock('../middleware/authMiddleware', () => ({
  protect: (req, res, next) => {
    req.user = { _id: 'mockUserId123' };
    next();
  }
}));

// Mock the models
jest.mock('../models/posts', () => {
  return {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
    find: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };
});

describe('Post Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT /api/v1/posts/:id/like', () => {
    it('should like a post successfully', async () => {
      // Mock post data
      const mockPost = {
        _id: 'postId123',
        title: 'Test Post',
        likes: [],
        likesCount: 0,
        save: jest.fn().mockResolvedValue(true)
      };
      
      mockPost.save = jest.fn().mockResolvedValue(mockPost);
      
      const mockPostModel = require('../models/posts');
      mockPostModel.findById.mockResolvedValue(mockPost);

      const response = await request(app)
        .put('/api/v1/posts/postId123/like')
        .set('Authorization', 'Bearer mockToken')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.postId).toBe('postId123');
    });

    it('should return error if post is already liked', async () => {
      // Mock post data with user already in likes
      const mockPost = {
        _id: 'postId123',
        likes: [{ user: 'mockUserId123' }],
        likesCount: 1,
        save: jest.fn()
      };
      
      const mockPostModel = require('../models/posts');
      mockPostModel.findById.mockResolvedValue(mockPost);

      const response = await request(app)
        .put('/api/v1/posts/postId123/like')
        .set('Authorization', 'Bearer mockToken')
        .expect(400);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('PUT /api/v1/posts/:id/unlike', () => {
    it('should unlike a post successfully', async () => {
      // Mock post data with user in likes
      const mockPost = {
        _id: 'postId123',
        likes: [{ user: 'mockUserId123' }],
        likesCount: 1,
        save: jest.fn().mockResolvedValue(true)
      };
      
      mockPost.save = jest.fn().mockResolvedValue(mockPost);
      
      const mockPostModel = require('../models/posts');
      mockPostModel.findById.mockResolvedValue(mockPost);

      const response = await request(app)
        .put('/api/v1/posts/postId123/unlike')
        .set('Authorization', 'Bearer mockToken')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.postId).toBe('postId123');
    });

    it('should return error if post is not liked', async () => {
      // Mock post data without user in likes
      const mockPost = {
        _id: 'postId123',
        likes: [{ user: 'differentUserId' }],
        likesCount: 1,
        save: jest.fn()
      };
      
      const mockPostModel = require('../models/posts');
      mockPostModel.findById.mockResolvedValue(mockPost);

      const response = await request(app)
        .put('/api/v1/posts/postId123/unlike')
        .set('Authorization', 'Bearer mockToken')
        .expect(400);

      expect(response.body.status).toBe('fail');
    });
  });
});