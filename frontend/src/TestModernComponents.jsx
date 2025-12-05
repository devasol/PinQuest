import React, { useState } from 'react';
import ModernPostWindow from './components/PostWindow/ModernPostWindow';
import ModernCreatePostModal from './components/Discover/ModernCreatePostModal';

const TestModernComponents = () => {
  const [isPostWindowOpen, setIsPostWindowOpen] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  
  // Sample post data for testing
  const samplePost = {
    _id: '1',
    title: 'Sample Post Title',
    description: 'This is a sample post description for testing the modern UI components. It showcases the new design and functionality we have implemented.',
    category: 'general',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      address: 'New York, NY, USA'
    },
    postedBy: {
      name: 'John Doe'
    },
    datePosted: new Date().toISOString(),
    averageRating: 4.5,
    totalRatings: 12,
    images: ['https://via.placeholder.com/400x300'],
    comments: [
      {
        _id: 'comment1',
        text: 'This is a sample comment!',
        user: { name: 'Jane Smith' },
        createdAt: new Date().toISOString()
      }
    ]
  };

  const handleOpenPostWindow = () => {
    setIsPostWindowOpen(true);
  };

  const handleClosePostWindow = () => {
    setIsPostWindowOpen(false);
  };

  const handleOpenCreatePost = () => {
    setIsCreatePostModalOpen(true);
  };

  const handleCloseCreatePost = () => {
    setIsCreatePostModalOpen(false);
  };

  const handleCreatePost = async (postData) => {
    console.log('Creating post with data:', postData);
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Post created successfully');
        resolve({ success: true });
      }, 1000);
    });
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Modern Components Test</h1>
      
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Modern Post Window</h2>
          <p className="text-gray-600 mb-4">Click the button below to test the new modern PostWindow component with enhanced UI/UX.</p>
          <button
            onClick={handleOpenPostWindow}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-md"
          >
            Open Modern Post Window
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Modern Create Post Modal</h2>
          <p className="text-gray-600 mb-4">Click the button below to test the new modern CreatePostModal component with enhanced UI/UX.</p>
          <button
            onClick={handleOpenCreatePost}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-md"
          >
            Open Modern Create Post Modal
          </button>
        </div>
      </div>

      {/* Test Modern PostWindow */}
      <ModernPostWindow
        post={samplePost}
        currentUser={{ name: 'Current User' }}
        authToken="test-token"
        isAuthenticated={true}
        isOpen={isPostWindowOpen}
        onClose={handleClosePostWindow}
        onSave={() => console.log('Post saved')}
        onRate={() => console.log('Post rated')}
        onGetDirections={() => console.log('Getting directions')}
      />

      {/* Test Modern CreatePostModal */}
      <ModernCreatePostModal
        isVisible={isCreatePostModalOpen}
        onClose={handleCloseCreatePost}
        onCreatePost={handleCreatePost}
        selectedPosition={{ lat: 40.7128, lng: -74.0060 }}
        position={{ x: 500, y: 300 }}
      />
    </div>
  );
};

export default TestModernComponents;