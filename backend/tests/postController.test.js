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
  // Create a simple mock model that can chain populate
  const mockModelInstance = {
    save: jest.fn(),
    populate: jest.fn()
  };

  const mockModel = {
    findById: jest.fn()
  };

  return mockModel;
});

describe('Post Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock implementation for findById that returns a mock post
    // with chainable populate method
    const postModel = require('../models/posts');
    postModel.findById.mockImplementation(() => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn()
      };
      return mockQuery;
    });
  });

  describe('PUT /api/v1/posts/:id/like', () => {
    it('should like a post successfully', async () => {
      const mockPost = {
        _id: 'postId123',
        title: 'Test Post',
        likes: [],
        likesCount: 0,
        save: jest.fn().mockResolvedValue(true)
      };
      
      const mockPostModel = require('../models/posts');
      const mockQuery = mockPostModel.findById('postId123');
      mockQuery.exec.mockResolvedValue(mockPost);

      const response = await request(app)
        .put('/api/v1/posts/postId123/like')
        .set('Authorization', 'Bearer mockToken')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.postId).toBe('postId123');
    });

    it('should return error if post is already liked', async () => {
      const mockPost = {
        _id: 'postId123',
        likes: [{ user: 'mockUserId123' }],
        likesCount: 1,
        save: jest.fn()
      };
      
      const mockPostModel = require('../models/posts');
      const mockQuery = mockPostModel.findById('postId123');
      mockQuery.exec.mockResolvedValue(mockPost);

      const response = await request(app)
        .put('/api/v1/posts/postId123/like')
        .set('Authorization', 'Bearer mockToken')
        .expect(400);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('PUT /api/v1/posts/:id/unlike', () => {
    it('should unlike a post successfully', async () => {
      const mockPost = {
        _id: 'postId123',
        likes: [{ user: 'mockUserId123' }],
        likesCount: 1,
        save: jest.fn().mockResolvedValue(true)
      };
      
      const mockPostModel = require('../models/posts');
      const mockQuery = mockPostModel.findById('postId123');
      mockQuery.exec.mockResolvedValue(mockPost);

      const response = await request(app)
        .put('/api/v1/posts/postId123/unlike')
        .set('Authorization', 'Bearer mockToken')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.postId).toBe('postId123');
    });

    it('should return error if post is not liked', async () => {
      const mockPost = {
        _id: 'postId123',
        likes: [{ user: 'differentUserId' }],
        likesCount: 1,
        save: jest.fn()
      };
      
      const mockPostModel = require('../models/posts');
      const mockQuery = mockPostModel.findById('postId123');
      mockQuery.exec.mockResolvedValue(mockPost);

      const response = await request(app)
        .put('/api/v1/posts/postId123/unlike')
        .set('Authorization', 'Bearer mockToken')
        .expect(400);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('POST /api/v1/posts/:id/comments', () => {
    it('should add a comment successfully', async () => {
      const mockPost = {
        _id: 'postId123',
        title: 'Test Post',
        comments: [],
        postedBy: { _id: 'differentUserId' },
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn()
      };
      
      const mockPostModel = require('../models/posts');
      const mockQuery = mockPostModel.findById('postId123');
      mockQuery.exec.mockResolvedValue(mockPost);

      const response = await request(app)
        .post('/api/v1/posts/postId123/comments')
        .set('Authorization', 'Bearer mockToken')
        .send({ text: 'Test comment' })
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.comment.text).toBe('Test comment');
    });

    it('should return error if user already commented on the post', async () => {
      const mockPost = {
        _id: 'postId123',
        title: 'Test Post',
        comments: [{ user: 'mockUserId123', text: 'Existing comment' }],
        postedBy: { _id: 'differentUserId' },
        save: jest.fn()
      };
      
      const mockPostModel = require('../models/posts');
      const mockQuery = mockPostModel.findById('postId123');
      mockQuery.exec.mockResolvedValue(mockPost);

      const response = await request(app)
        .post('/api/v1/posts/postId123/comments')
        .set('Authorization', 'Bearer mockToken')
        .send({ text: 'New comment' })
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('User can only leave one comment per post');
    });

    it('should return error if comment text is missing', async () => {
      const mockPost = {
        _id: 'postId123',
        title: 'Test Post',
        comments: [],
        postedBy: { _id: 'differentUserId' },
        save: jest.fn()
      };
      
      const mockPostModel = require('../models/posts');
      const mockQuery = mockPostModel.findById('postId123');
      mockQuery.exec.mockResolvedValue(mockPost);

      const response = await request(app)
        .post('/api/v1/posts/postId123/comments')
        .set('Authorization', 'Bearer mockToken')
        .send({})
        .expect(400);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('POST /api/v1/posts/:postId/comments/:commentId/like', () => {
    it('should add a like to a comment successfully', async () => {
      const mockPost = {
        _id: 'postId123',
        title: 'Test Post',
        comments: [{
          _id: 'commentId123',
          user: 'differentUserId',
          text: 'Test comment',
          likes: [],
          likesCount: 0
        }],
        postedBy: { _id: 'differentUserId' },
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn()
      };
      
      const mockPostModel = require('../models/posts');
      const mockQuery = mockPostModel.findById('postId123');
      mockQuery.exec.mockResolvedValue(mockPost);

      const response = await request(app)
        .post('/api/v1/posts/postId123/comments/commentId123/like')
        .set('Authorization', 'Bearer mockToken')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.comment.likesCount).toBe(1);
      expect(response.body.data.comment.likes).toHaveLength(1);
    });

    it('should remove a like from a comment when user already liked it (toggle off)', async () => {
      const mockPost = {
        _id: 'postId123',
        title: 'Test Post',
        comments: [{
          _id: 'commentId123',
          user: 'differentUserId',
          text: 'Test comment',
          likes: [{ user: 'mockUserId123' }],
          likesCount: 1
        }],
        postedBy: { _id: 'differentUserId' },
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn()
      };
      
      const mockPostModel = require('../models/posts');
      const mockQuery = mockPostModel.findById('postId123');
      mockQuery.exec.mockResolvedValue(mockPost);

      const response = await request(app)
        .post('/api/v1/posts/postId123/comments/commentId123/like')
        .set('Authorization', 'Bearer mockToken')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.comment.likesCount).toBe(0);
      expect(response.body.data.comment.likes).toHaveLength(0);
    });
  });
});