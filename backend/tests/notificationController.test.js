// backend/tests/notificationController.test.js
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const app = express();

// Mock the database connection
jest.mock('../config/dbConfig', () => jest.fn());

// Import routes
const authRoute = require('../routes/auth');
const notificationsRoute = require('../routes/notificationsRoute');

app.use(express.json());
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/notifications', notificationsRoute);

// Mock the auth middleware
jest.mock('../middleware/authMiddleware', () => ({
  protect: (req, res, next) => {
    req.user = { _id: 'mockUserId123' };
    next();
  }
}));

// Mock the models
jest.mock('../models/Notification', () => {
  const actual = jest.requireActual('mongoose');
  return {
    find: jest.fn(),
    countDocuments: jest.fn(),
    updateMany: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  };
});

describe('Notification Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/notifications', () => {
    it('should return user notifications', async () => {
      // Mock the Notification model
      const mockNotifications = [
        {
          _id: '1',
          recipient: 'mockUserId123',
          sender: 'mockSenderId',
          type: 'like',
          message: 'Test notification',
          read: false,
          date: new Date()
        }
      ];
      
      const mockNotificationModel = require('../models/Notification');
      mockNotificationModel.find.mockResolvedValue(mockNotifications);
      mockNotificationModel.countDocuments.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', 'Bearer mockToken')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.notifications).toHaveLength(1);
    });
  });

  describe('PUT /api/v1/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const mockNotificationModel = require('../models/Notification');
      mockNotificationModel.updateMany.mockResolvedValue({ nModified: 2 });

      const response = await request(app)
        .put('/api/v1/notifications/read-all')
        .set('Authorization', 'Bearer mockToken')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('All notifications marked as read');
    });
  });

  describe('GET /api/v1/notifications/unread-count', () => {
    it('should return unread notifications count', async () => {
      const mockNotificationModel = require('../models/Notification');
      mockNotificationModel.countDocuments.mockResolvedValue(5);

      const response = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', 'Bearer mockToken')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.count).toBe(5);
    });
  });
});