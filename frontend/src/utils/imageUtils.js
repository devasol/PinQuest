// frontend/src/utils/imageUtils.js
// Extract the base server URL from the API base URL for image paths
const getServerBaseUrl = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
  // Remove the /api/v1 part to get the base server URL
  return apiBaseUrl.replace('/api/v1', '');
};

// Helper function to get the correct image URL
export const getImageUrl = (imageObj) => {
  if (!imageObj) return '';
  
  const serverBaseUrl = getServerBaseUrl();
  
  if (typeof imageObj === 'string') {
    return imageObj.startsWith('http') ? imageObj : `${serverBaseUrl}${imageObj}`;
  }
  
  if (imageObj.url) {
    return imageObj.url.startsWith('http') 
      ? imageObj.url 
      : `${serverBaseUrl}${imageObj.url}`;
  }
  
  return '';
};

// Helper function to format dates consistently
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Helper function to get image count from post
export const getImageCount = (post) => {
  if (post.images && Array.isArray(post.images) && post.images.length > 0) {
    return post.images.length;
  }
  if (post.image) {
    return 1;
  }
  return 0;
};