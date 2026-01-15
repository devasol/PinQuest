import React, { useState } from 'react';
import PostWindow from './components/PostWindow/PostWindow';
import { useAuth } from './contexts/AuthContext';

const TestPostWindow = () => {
  const { user, isAuthenticated } = useAuth();
  const authToken = isAuthenticated ? localStorage.getItem('token') : null;

  // Sample post data for testing
  const samplePost = {
    _id: 'test-post-1',
    title: 'Beautiful Mountain View',
    description: 'This is a stunning view of the mountains I captured during my hiking trip. The colors were absolutely breathtaking at sunset.',
    category: 'Nature',
    image: {
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
      publicId: 'sample-image'
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
        publicId: 'sample-image1'
      },
      {
        url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
        publicId: 'sample-image2'
      },
      {
        url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
        publicId: 'sample-image3'
      }
    ],
    postedBy: {
      name: 'John Doe',
      avatar: {
        url: 'https://via.placeholder.com/150',
        public_id: 'user-avatar'
      }
    },
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      address: 'New York, NY, USA'
    },
    datePosted: new Date().toISOString(),
    likes: [],
    likesCount: 0,
    comments: []
  };

  const [isPostWindowOpen, setIsPostWindowOpen] = useState(false);

  const handleOpenPostWindow = () => {
    setIsPostWindowOpen(true);
  };

  const handleClosePostWindow = () => {
    setIsPostWindowOpen(false);
  };

  const handleLike = (postId, isLiked) => {
    console.log(`Post ${postId} ${isLiked ? 'liked' : 'unliked'}`);
  };

  const handleComment = (postId) => {
    console.log(`Comment clicked for post ${postId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">PostWindow Component Test</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-lg mb-6">Click the button below to test the PostWindow component</p>
          <button
            onClick={handleOpenPostWindow}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Open Post Window
          </button>
        </div>

        {/* Test PostWindow */}
        <PostWindow
          post={samplePost}
          currentUser={user}
          authToken={authToken}
          isAuthenticated={isAuthenticated}
          isOpen={isPostWindowOpen}
          onClose={handleClosePostWindow}
          onLike={handleLike}
          onComment={handleComment}
        />
      </div>
    </div>
  );
};

export default TestPostWindow;