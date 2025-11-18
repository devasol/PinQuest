# PinQuest API Documentation

## Authentication

### Register User
- **POST** `/api/v1/auth/register`
- **Description:** Register a new user
- **Request Body:**
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Response:** User object with token

### Login User  
- **POST** `/api/v1/auth/login`
- **Description:** Authenticate user and return token
- **Request Body:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response:** User object with token

### Get User Profile
- **GET** `/api/v1/auth/profile`
- **Description:** Get current user profile
- **Headers:** Authorization: Bearer {token}
- **Response:** User object

### Update User Profile
- **PUT** `/api/v1/auth/profile`
- **Description:** Update current user profile
- **Headers:** Authorization: Bearer {token}
- **Request Body:** 
  ```json
  {
    "name": "string",
    "email": "string"
  }
  ```
- **File Upload:** avatar (multipart/form-data)

## Posts

### Get All Posts
- **GET** `/api/v1/posts`
- **Description:** Get all posts
- **Response:** Array of post objects

### Create Post
- **POST** `/api/v1/posts`
- **Description:** Create a new post
- **Headers:** Authorization: Bearer {token}
- **Request Body:**
  ```json
  {
    "title": "string",
    "description": "string",
    "category": "string",
    "location": {
      "latitude": "number",
      "longitude": "number"
    }
  }
  ```
- **File Upload:** image (multipart/form-data)

### Get Post by ID
- **GET** `/api/v1/posts/:id`
- **Description:** Get a specific post
- **Response:** Post object

### Update Post
- **PATCH** `/api/v1/posts/:id`
- **Description:** Update a post
- **Headers:** Authorization: Bearer {token}
- **Request Body:** Same as create
- **File Upload:** image (multipart/form-data)

### Delete Post
- **DELETE** `/api/v1/posts/:id`
- **Description:** Delete a post
- **Headers:** Authorization: Bearer {token}

### Like Post
- **PUT** `/api/v1/posts/:id/like`
- **Description:** Like a post
- **Headers:** Authorization: Bearer {token}
- **Response:** Updated likes information

### Unlike Post
- **PUT** `/api/v1/posts/:id/unlike`
- **Description:** Unlike a post
- **Headers:** Authorization: Bearer {token}
- **Response:** Updated likes information

### Add Comment
- **POST** `/api/v1/posts/:id/comments`
- **Description:** Add a comment to a post
- **Headers:** Authorization: Bearer {token}
- **Request Body:**
  ```json
  {
    "text": "string"
  }
  ```

### Get Post Comments
- **GET** `/api/v1/posts/:id/comments`
- **Description:** Get all comments for a post
- **Response:** Array of comment objects

## Users

### Get All Users
- **GET** `/api/v1/users`
- **Description:** Get all users
- **Response:** Array of user objects

### Get User by ID
- **GET** `/api/v1/users/:id`
- **Description:** Get user by ID
- **Response:** User object

### Get User Posts
- **GET** `/api/v1/users/:id/posts`
- **Description:** Get all posts by a user
- **Response:** Array of post objects

### Follow User
- **POST** `/api/v1/users/:id/follow`
- **Description:** Follow a user
- **Headers:** Authorization: Bearer {token}

### Unfollow User
- **DELETE** `/api/v1/users/:id/unfollow`
- **Description:** Unfollow a user
- **Headers:** Authorization: Bearer {token}

### Get User Followers
- **GET** `/api/v1/users/:id/followers`
- **Description:** Get a user's followers
- **Response:** Array of follower objects

### Get User Following
- **GET** `/api/v1/users/:id/following`
- **Description:** Get users the user is following
- **Response:** Array of following objects

### Add Favorite
- **POST** `/api/v1/users/favorites`
- **Description:** Add a post to favorites
- **Headers:** Authorization: Bearer {token}
- **Request Body:**
  ```json
  {
    "postId": "string"
  }
  ```

### Remove Favorite
- **DELETE** `/api/v1/users/favorites/:postId`
- **Description:** Remove a post from favorites
- **Headers:** Authorization: Bearer {token}

## Saved Locations

### Add Saved Location
- **POST** `/api/v1/users/saved-locations`
- **Description:** Add a location to user's saved locations
- **Headers:** Authorization: Bearer {token}
- **Request Body:**
  ```json
  {
    "id": "string",
    "name": "string",
    "latitude": 0.0,
    "longitude": 0.0,
    "address": "string",
    "placeId": "string",
    "type": "string",
    "category": "string",
    "description": "string",
    "postedBy": "string",
    "datePosted": "string"
  }
  ```

### Remove Saved Location
- **DELETE** `/api/v1/users/saved-locations/:locationId`
- **Description:** Remove a location from user's saved locations
- **Headers:** Authorization: Bearer {token}

### Get User Saved Locations
- **GET** `/api/v1/users/saved-locations`
- **Description:** Get current user's saved locations
- **Headers:** Authorization: Bearer {token}
- **Response:**
  ```json
  {
    "status": "success",
    "data": {
      "savedLocations": [
        {
          "id": "string",
          "name": "string",
          "latitude": 0.0,
          "longitude": 0.0,
          "address": "string",
          "placeId": "string",
          "type": "string",
          "category": "string",
          "description": "string",
          "postedBy": "string",
          "datePosted": "string",
          "savedAt": "2025-11-18T04:24:34.123Z"
        }
      ]
    }
  }
  ```

### Get User Favorites
- **GET** `/api/v1/users/favorites`
- **Description:** Get current user's favorites
- **Headers:** Authorization: Bearer {token}

## Categories

### Get All Categories
- **GET** `/api/v1/categories`
- **Description:** Get all post categories
- **Response:** Array of category strings

### Get Popular Categories
- **GET** `/api/v1/categories/popular`
- **Description:** Get popular categories with post counts
- **Response:** Array of category objects with counts

### Get Posts by Category
- **GET** `/api/v1/categories/:category`
- **Description:** Get posts in a specific category
- **Response:** Array of post objects

## Notifications

### Get User Notifications
- **GET** `/api/v1/notifications`
- **Description:** Get user notifications
- **Headers:** Authorization: Bearer {token}
- **Query Parameters:**
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `read`: Filter by read status (all|read|unread)

### Get Unread Count
- **GET** `/api/v1/notifications/unread-count`
- **Description:** Get count of unread notifications
- **Headers:** Authorization: Bearer {token}

### Mark All as Read
- **PUT** `/api/v1/notifications/read-all`
- **Description:** Mark all notifications as read
- **Headers:** Authorization: Bearer {token}

### Mark Notification as Read
- **PUT** `/api/v1/notifications/:id`
- **Description:** Mark specific notification as read
- **Headers:** Authorization: Bearer {token}

## Feed

### Get Activity Feed
- **GET** `/api/v1/feed`
- **Description:** Get posts from followed users
- **Headers:** Authorization: Bearer {token}
- **Query Parameters:**
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)

### Get Personal Activity
- **GET** `/api/v1/feed/personal`
- **Description:** Get user's own posts and liked posts
- **Headers:** Authorization: Bearer {token}

### Get Trending Posts
- **GET** `/api/v1/feed/trending`
- **Description:** Get trending posts
- **Query Parameters:**
  - `limit`: Number of posts (default: 10)
  - `days`: Consider posts from last N days (default: 7)

## Messages

### Send Message
- **POST** `/api/v1/messages`
- **Description:** Send a message to another user
- **Headers:** Authorization: Bearer {token}
- **Request Body:**
  ```json
  {
    "recipientId": "string",
    "content": "string"
  }
  ```

### Get Conversations
- **GET** `/api/v1/messages/conversations`
- **Description:** Get user's conversations
- **Headers:** Authorization: Bearer {token}

### Get Conversation Messages
- **GET** `/api/v1/messages/conversation/:userId`
- **Description:** Get messages in a conversation with a user
- **Headers:** Authorization: Bearer {token}

## Search

### Search Posts
- **GET** `/api/v1/posts/search`
- **Description:** Search posts by text and category
- **Query Parameters:**
  - `q`: Search query text
  - `category`: Filter by category
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)

## Geolocation

### Get Posts by Location
- **GET** `/api/v1/posts/by-location`
- **Description:** Get posts near a specific location
- **Query Parameters:**
  - `latitude`: Latitude coordinate
  - `longitude`: Longitude coordinate
  - `radius`: Search radius in km (default: 50)

### Get Nearby Posts
- **GET** `/api/v1/posts/nearby`
- **Description:** Get posts within a radius of location
- **Query Parameters:**
  - `latitude`: Latitude coordinate
  - `longitude`: Longitude coordinate
  - `radius`: Search radius in km (default: 10)
  - `limit`: Max results (default: 20)

## Reports

### Create Report
- **POST** `/api/v1/reports`
- **Description:** Report a post
- **Headers:** Authorization: Bearer {token}
- **Request Body:**
  ```json
  {
    "postId": "string",
    "reason": "string",
    "description": "string"
  }
  ```

### Get User Reports
- **GET** `/api/v1/reports/my-reports`
- **Description:** Get reports created by user
- **Headers:** Authorization: Bearer {token}

## Analytics

### Get Platform Stats
- **GET** `/api/v1/analytics/platform`
- **Description:** Get platform-wide statistics
- **Headers:** Authorization: Bearer {token}

### Get User Analytics
- **GET** `/api/v1/analytics/user`
- **Description:** Get current user's analytics
- **Headers:** Authorization: Bearer {token}

### Get Top Posts
- **GET** `/api/v1/analytics/top-posts`
- **Description:** Get top performing posts
- **Headers:** Authorization: Bearer {token}
- **Query Parameters:**
  - `limit`: Number of posts (default: 10)
  - `days`: Consider posts from last N days (default: 30)