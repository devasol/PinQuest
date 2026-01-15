// frontend/src/utils/imageUtils.js
// Extract the base server URL from the API base URL for image paths
const getServerBaseUrl = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

  try {
    // If it's a full URL, parse it properly
    if (apiBaseUrl.startsWith('http')) {
      const url = new URL(apiBaseUrl);
      
      // If the pathname ends with /api/v1, remove it
      if (url.pathname.includes('/api/v1')) {
        const baseUrl = `${url.protocol}//${url.host}`;
        const pathBeforeApi = url.pathname.split('/api/v1')[0];
        return `${baseUrl}${pathBeforeApi}`.replace(/\/$/, ""); // Remove trailing slash
      }
      
      // If no /api/v1 in pathname, return the base URL up to the host
      return `${url.protocol}//${url.host}${url.pathname}`.replace(/\/$/, "");
    }
    // If it's a relative path
    else {
      if (apiBaseUrl.includes('/api/v1')) {
        return apiBaseUrl.split('/api/v1')[0].replace(/\/$/, "");
      }
      return apiBaseUrl.replace(/\/$/, "");
    }
  } catch (e) {
    console.error('Error parsing API base URL:', e);
    return apiBaseUrl.split('/api/v1')[0].replace(/\/$/, "");
  }
};

// Helper function to get the correct image URL
export const getImageUrl = (imageObj) => {
  if (!imageObj) return '';

  const serverBaseUrl = getServerBaseUrl();

  // Helper to ensure path starts with / and combine with base
  const combineWithBase = (path) => {
    if (!path) return '';

    // If it's already a full URL, return it
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    // Check if it already has /uploads prefix - if it does, don't add it again
    const finalPath = cleanPath.startsWith('/uploads/')
      ? cleanPath
      : `/uploads${cleanPath}`;

    return `${serverBaseUrl}${finalPath}`.replace(/([^:]\/)\/+/g, '$1');
  };

  if (typeof imageObj === 'string') {
    // If it's already a complete URL
    if (imageObj.startsWith('http') || imageObj.startsWith('https')) {
      try {
        const urlObj = new URL(imageObj);
        // If it's from our server (contains /uploads/), normalize it to current server base
        if (urlObj.pathname.includes('/uploads/')) {
          const uploadsPath = urlObj.pathname.substring(urlObj.pathname.indexOf('/uploads/'));
          return combineWithBase(uploadsPath);
        }
        return imageObj; // Other external URLs
      } catch (e) {
        return imageObj;
      }
    }
    return combineWithBase(imageObj);
  }

  // Handle object
  if (typeof imageObj === 'object') {
    // Try different possible properties that could contain the image URL
    // Prioritize url first, then path, then filename, then publicId
    let url = imageObj.url || imageObj.path || imageObj.filename || imageObj.publicId || '';
    if (!url) return '';

    // If we got the URL from filename or publicId and it's not already a path, construct it
    if ((imageObj.filename && url === imageObj.filename && !url.startsWith('/')) ||
        (imageObj.publicId && url === imageObj.publicId && !url.startsWith('/'))) {
      url = `/uploads/${url}`;
    }

    if (typeof url === 'string') {
      if (url.startsWith('http') || url.startsWith('https')) {
        try {
          const urlObj = new URL(url);
          if (urlObj.pathname.includes('/uploads/')) {
            const uploadsPath = urlObj.pathname.substring(urlObj.pathname.indexOf('/uploads/'));
            return combineWithBase(uploadsPath);
          }
          return url;
        } catch (e) {
          return url;
        }
      }
      return combineWithBase(url);
    }
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