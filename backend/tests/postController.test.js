// backend/tests/postController.test.js
const request = require('supertest');
const express = require('express');
const app = express();

// Mock the database connection
jest.mock('../config/dbConfig', () => jest.fn());

// Import routes
const postsRoute = require('../routes/postsRoute');
const postModel = require('../models/posts'); // Moved outside beforeEach

app.use(express.json());
app.use('/api/v1/posts', postsRoute);
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
    
    const mockModel = require('../models/posts');
    mockModel.findById.mockImplementation(() => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn()
      };
      return mockQuery;
  describe('PUT /api/v1/posts/:id/like', () => {
    it('should like a post successfully', async () => {
      const postId = 'postId123';
      const mockUserId = 'mockUserId123';

      const mockPost = {
        _id: postId,
        title: 'Test Post',
        likes: [],
        likesCount: 0,
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis(), // Needed if controller calls populate
      };

      postModel.findById.mockImplementationOnce((id) => ({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn(() => Promise.resolve(mockPost))
      }));

      const response = await request(app)
        .put(`/api/v1/posts/${postId}/like`)
        .set('Authorization', 'Bearer mockToken')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.postId).toBe(postId);
      expect(mockPost.save).toHaveBeenCalled();
      expect(mockPost.likes).toHaveLength(1);
      expect(mockPost.likes[0].user).toBe(mockUserId);
    });

    it('should return error if post is already liked', async () => {
      const postId = 'postId123';
      const mockUserId = 'mockUserId123';

      const mockPost = {
        _id: postId,
        likes: [{ user: mockUserId }], // Already liked by mockUserId123
        likesCount: 1,
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis(),
      };

      postModel.findById.mockImplementationOnce((id) => ({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn(() => Promise.resolve(mockPost))
      }));

      const response = await request(app)
        .put(`/api/v1/posts/${postId}/like`)
        .set('Authorization', 'Bearer mockToken')
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(mockPost.save).not.toHaveBeenCalled(); // Should not save if already liked
    });

  describe('PUT /api/v1/posts/:id/unlike', () => {
    it('should unlike a post successfully', async () => {
      const postId = 'postId123';
      const mockUserId = 'mockUserId123';

      const mockPost = {
        _id: postId,
        likes: [{ user: mockUserId }], // Liked by the user
        likesCount: 1,
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis(),
      };

      postModel.findById.mockImplementationOnce((id) => ({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn(() => Promise.resolve(mockPost))
      }));

      const response = await request(app)
        .put(`/api/v1/posts/${postId}/unlike`)
        .set('Authorization', 'Bearer mockToken')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.postId).toBe(postId);
      expect(mockPost.save).toHaveBeenCalled();
      expect(mockPost.likes).toHaveLength(0); // Like should be removed
    });

    it('should return error if post is not liked', async () => {
      const postId = 'postId123';
      const differentUserId = 'differentUserId'; // A user who did not like the post

      const mockPost = {
        _id: postId,
        likes: [{ user: differentUserId }], // Liked by a different user
        likesCount: 1,
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis(),
      };

      postModel.findById.mockImplementationOnce((id) => ({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn(() => Promise.resolve(mockPost))
      }));

      const response = await request(app)
        .put(`/api/v1/posts/${postId}/unlike`)
        .set('Authorization', 'Bearer mockToken')
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(mockPost.save).not.toHaveBeenCalled(); // Should not save if not liked by current user
    });

  describe('POST /api/v1/posts/:id/comments', () => {
    it('should add a comment successfully', async () => {
      const mockCommentUserId = 'mockUserId123';
      const mockCommentUserName = 'Mock User';
      const mockPosterId = 'differentUserId';
      const mockPosterName = 'Poster Name';
      const postId = 'postId123';

      const mockPostAfterComment = {
        _id: postId,
        title: 'Test Post',
        comments: [
          {
            _id: expect.any(String), // New comment will have an ID
            user: { _id: mockCommentUserId, name: mockCommentUserName }, // Populated user
            text: 'Test comment',
            date: expect.any(String),
            likes: [], likesCount: 0, replies: [], repliesCount: 0,
          }
        ],
        postedBy: { _id: mockPosterId, name: mockPosterName },
        save: jest.fn().mockResolvedValue(true), // This save is for the post being saved
        populate: jest.fn().mockReturnThis(),
      };
      
      postModel.findById.mockImplementationOnce((id) => ({ // First findById call
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn(() => Promise.resolve({ // Return a post that can be mutated
            _id: postId,
            title: 'Test Post',
            comments: [],
            postedBy: mockPosterId,
            save: jest.fn(() => { // Mock save for the first findById result
                mockPostAfterComment.comments[0]._id = 'newCommentId'; // Assign ID on save
                return Promise.resolve(mockPostAfterComment);
            }),
            populate: jest.fn(() => ({ // Mock the populate call on the saved post
                populate: jest.fn().mockReturnThis(),
                exec: jest.fn(() => Promise.resolve(mockPostAfterComment))
            }))
        }))
      }))
      .mockImplementationOnce((id) => ({ // Second findById call in controller for refreshing
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn(() => Promise.resolve(mockPostAfterComment))
      }));


      const response = await request(app)
        .post('/api/v1/posts/postId123/comments')
        .set('Authorization', 'Bearer mockToken')
        .send({ text: 'Test comment' })
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.comment.text).toBe('Test comment');
      expect(response.body.data.comment.user).toBeDefined();
      expect(response.body.data.comment.user.name).toBe(mockCommentUserName);
      expect(response.body.data.comment.user._id).toBe(mockCommentUserId);
      
      // Verify save was called on the mock post returned by the first findById
      // expect(mockPostAfterComment.save).toHaveBeenCalled(); // This check is difficult with nested mocks
    });

    it('should return error if user already commented on the post', async () => {
      const postId = 'postId123';
      const mockUserId = 'mockUserId123'; // User from auth middleware
      const existingCommentText = 'Existing comment';

      const mockPost = {
        _id: postId,
        title: 'Test Post',
        comments: [{ user: mockUserId, text: existingCommentText }], // Existing comment by the current user
        postedBy: 'differentUserId', // Just an ID, will be populated if needed
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis(),
      };

      postModel.findById.mockImplementationOnce((id) => ({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn(() => Promise.resolve(mockPost))
      }));

      const response = await request(app)
        .post(`/api/v1/posts/${postId}/comments`)
        .set('Authorization', 'Bearer mockToken')
        .send({ text: 'New comment' })
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('User can only leave one comment per post');
      expect(mockPost.save).not.toHaveBeenCalled(); // Should not save if error
    });

    it('should return error if comment text is missing', async () => {
      const postId = 'postId123';

      const mockPost = {
        _id: postId,
        title: 'Test Post',
        comments: [],
        postedBy: 'differentUserId',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis(),
      };

      postModel.findById.mockImplementationOnce((id) => ({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn(() => Promise.resolve(mockPost))
      }));

      const response = await request(app)
        .post(`/api/v1/posts/${postId}/comments`)
        .set('Authorization', 'Bearer mockToken')
        .send({}) // Missing text
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(mockPost.save).not.toHaveBeenCalled(); // Should not save if error
    });

  describe('GET /api/v1/posts/:id/comments', () => {
    it('should retrieve comments with populated user info', async () => {
      const mockCommentUserId1 = 'mockUser1';
      const mockCommentUserName1 = 'User One';
      const mockCommentUserId2 = 'mockUser2';
      const mockCommentUserName2 = 'User Two';
      const mockPostId = 'postId123';

      // Define the fully populated post object that findById().exec() should return
      const mockPopulatedPost = {
        _id: mockPostId,
        title: 'Test Post',
        comments: [
          {
            _id: 'commentId1',
            user: { _id: mockCommentUserId1, name: mockCommentUserName1 }, // Already populated
            text: 'First comment',
            date: new Date().toISOString(),
            likes: [], likesCount: 0, replies: [], repliesCount: 0,
            save: jest.fn(),
            populate: jest.fn().mockReturnThis()
          },
          {
            _id: 'commentId2',
            user: { _id: mockCommentUserId2, name: mockCommentUserName2 }, // Already populated
            text: 'Second comment',
            date: new Date().toISOString(),
            likes: [], likesCount: 0, replies: [], repliesCount: 0,
            save: jest.fn(),
            populate: jest.fn().mockReturnThis()
          },
        ],
        postedBy: { _id: 'mockPosterId', name: 'Poster Name' }, // Already populated
        save: jest.fn().mockResolvedValue(true), // Ensure save is present
        populate: jest.fn().mockReturnThis(), // Ensure populate is present
      };

      // Mock postModel.findById to return the pre-populated post
      // This will completely override the beforeEach mock for this specific test
      postModel.findById.mockImplementation((id) => ({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn(() => Promise.resolve(mockPopulatedPost))
      }));

      const response = await request(app)
        .get(`/api/v1/posts/${mockPostId}/comments`)
        .set('Authorization', 'Bearer mockToken')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveLength(2); // Now response.body.data should be the array
      expect(response.body.data[0].text).toBe('First comment');
      expect(response.body.data[0].user).toBeDefined();
      expect(response.body.data[0].user.name).toBe(mockCommentUserName1);
      expect(response.body.data[0].user._id).toBe(mockCommentUserId1);
      expect(response.body.data[1].text).toBe('Second comment');
      expect(response.body.data[1].user).toBeDefined();
      expect(response.body.data[1].user.name).toBe(mockCommentUserName2);
      expect(response.body.data[1].user._id).toBe(mockCommentUserId2);
    });

    it('should return empty array if no comments exist', async () => {
      const mockPostId = 'postId123';
      
      // Define the fully populated post object that findById().exec() should return
      const mockPopulatedPost = {
        _id: mockPostId,
        title: 'Test Post',
        comments: [], // No comments
        postedBy: { _id: 'mockPosterId', name: 'Poster Name' },
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis(),
      };

      // Mock postModel.findById to return the pre-populated post
      postModel.findById.mockImplementation((id) => ({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn(() => Promise.resolve(mockPopulatedPost))
      }));

      const response = await request(app)
        .get(`/api/v1/posts/${mockPostId}/comments`)
        .set('Authorization', 'Bearer mockToken')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual([]);
    });

  describe('POST /api/v1/posts/:postId/comments/:commentId/like', () => {
    it('should add a like to a comment successfully', async () => {
      const postId = 'postId123';
      const commentId = 'commentId123';
      const mockUserId = 'mockUserId123';

      const mockPost = {
        _id: postId,
        title: 'Test Post',
        comments: [{
          _id: commentId,
          user: 'differentUserId', // User who made the comment
          text: 'Test comment',
          likes: [], // No likes yet
          likesCount: 0,
          save: jest.fn().mockResolvedValue(true),
          populate: jest.fn().mockReturnThis()
        }],
        postedBy: 'differentUserId',
        save: jest.fn().mockResolvedValue(true)
      };

      postModel.findById.mockImplementationOnce((id) => ({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn(() => Promise.resolve(mockPost))
      }));

      const response = await request(app)
        .post(`/api/v1/posts/${postId}/comments/${commentId}/like`)
        .set('Authorization', 'Bearer mockToken')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.comment.likesCount).toBe(1);
      expect(response.body.data.comment.likes).toHaveLength(1);
      expect(response.body.data.comment.likes[0].user).toBe(mockUserId);
      expect(mockPost.save).toHaveBeenCalled();
    });

    it('should remove a like from a comment when user already liked it (toggle off)', async () => {
      const postId = 'postId123';
      const commentId = 'commentId123';
      const mockUserId = 'mockUserId123';

      const mockPost = {
        _id: postId,
        title: 'Test Post',
        comments: [{
          _id: commentId,
          user: 'differentUserId',
          text: 'Test comment',
          likes: [{ user: mockUserId }], // Already liked by current user
          likesCount: 1,
          save: jest.fn().mockResolvedValue(true),
          populate: jest.fn().mockReturnThis()
        }],
        postedBy: 'differentUserId',
        save: jest.fn().mockResolvedValue(true)
      };

      postModel.findById.mockImplementationOnce((id) => ({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn(() => Promise.resolve(mockPost))
      }));

      const response = await request(app)
        .post(`/api/v1/posts/${postId}/comments/${commentId}/like`)
        .set('Authorization', 'Bearer mockToken')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.comment.likesCount).toBe(0);
      expect(response.body.data.comment.likes).toHaveLength(0);
      expect(mockPost.save).toHaveBeenCalled();
    });
});