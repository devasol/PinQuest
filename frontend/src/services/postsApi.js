// Posts API service
import { apiRequest } from './api.jsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const postsApi = {
  // Create a new post
  createPost: async (postData) => {
    try {
      // Get fresh token before making request
      let token = localStorage.getItem("token");
      try {
        const { auth } = await import('../config/firebase');
        const currentUser = auth.currentUser;
        if (currentUser) {
          token = await currentUser.getIdToken(true);
          localStorage.setItem("token", token);
        }
      } catch (tokenError) {
        console.warn('Could not refresh token:', tokenError);
      }
      
      // Use apiRequest with timeout support
      const response = await apiRequest('/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
        skipAuth: false,
        timeout: 30000, // 30 second timeout for JSON posts
      });
      
      return response;
    } catch (error) {
      console.error('Error creating post:', error);
      if (error.message?.includes('timeout')) {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      throw error;
    }
  },

  // Create a new post with form data (for file uploads)
  createPostWithFiles: async (formData) => {
    try {
      // For file uploads, we need to use fetch directly since FormData can't use the apiRequest function
      // Get fresh token from Firebase if user is logged in
      let token = localStorage.getItem("token");
      
      // Try to get fresh token from Firebase auth if available
      try {
        const { auth } = await import('../config/firebase');
        const currentUser = auth.currentUser;
        if (currentUser) {
          token = await currentUser.getIdToken(true); // Force refresh
          localStorage.setItem("token", token);
        }
      } catch (tokenError) {
        console.warn('Could not refresh token, using stored token:', tokenError);
        // Continue with stored token
      }
      
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for file uploads

      try {
        // First attempt with the initial token
        let response = await fetch(`${API_BASE_URL}/posts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
          signal: controller.signal, // Add abort signal
        });
        
        clearTimeout(timeoutId); // Clear timeout if request completes

      // Check if the response is likely an HTML error page
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('text/html')) {
        // This is likely an HTML error page from the server
        const htmlError = await response.text();
        if (htmlError.includes('<!DOCTYPE html') || htmlError.includes('<html')) {
          throw new Error(`Server error occurred. The server returned an error page instead of a valid response. Error: ${htmlError.substring(0, 200)}...`);
        }
      }
      
      if (!response.ok) {
        // For non-HTML errors, try to get error data
        const errorText = await response.text();
        
        // Check if the error indicates token expiration
        if (response.status === 401 && 
            (errorText.includes('token') || 
             errorText.includes('expired') || 
             errorText.includes('invalid'))) {
              
          console.log('Token expired during file upload, attempting refresh...');
          try {
            const { auth } = await import('../config/firebase');
            const currentUser = auth.currentUser;
            if (currentUser) {
              const refreshedToken = await currentUser.getIdToken(true);
              localStorage.setItem("token", refreshedToken);
              
              // Create new AbortController for retry
              const retryController = new AbortController();
              const retryTimeoutId = setTimeout(() => retryController.abort(), 60000);
              
              try {
                // Retry the request with the fresh token
                const retryResponse = await fetch(`${API_BASE_URL}/posts`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${refreshedToken}`,
                  },
                  body: formData,
                  signal: retryController.signal,
                });
                
                clearTimeout(retryTimeoutId);
                
                // Check if retry response is HTML
                const retryContentType = retryResponse.headers.get('content-type');
                if (retryContentType && retryContentType.includes('text/html')) {
                  const retryHtmlError = await retryResponse.text();
                  if (retryHtmlError.includes('<!DOCTYPE html') || retryHtmlError.includes('<html')) {
                    throw new Error(`Server error occurred. The server returned an error page instead of a valid response. Error: ${retryHtmlError.substring(0, 200)}...`);
                  }
                }
                
                if (!retryResponse.ok) {
                  const retryErrorText = await retryResponse.text();
                  let retryErrorData;
                  try {
                    retryErrorData = JSON.parse(retryErrorText);
                  } catch {
                    retryErrorData = { message: retryErrorText };
                  }
                  throw new Error(retryErrorData.message || `HTTP error! status: ${retryResponse.status}`);
                }
                
                return await retryResponse.json();
              } catch (retryError) {
                clearTimeout(retryTimeoutId);
                if (retryError.name === 'AbortError') {
                  throw new Error('Request timed out. Please try again with smaller images.');
                }
                throw retryError;
              }
            } else {
              throw new Error('Token expired and could not be refreshed.');
            }
          } catch (refreshError) {
            throw new Error('Token expired and could not be refreshed. Please login again.');
          }
        }
        
        // Check if the errorText is HTML or JSON
        if (errorText.includes('<!DOCTYPE html') || errorText.includes('<html')) {
          // Server returned HTML error page
          throw new Error(`Server error occurred. Error code: ${response.status}`);
        } else {
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
          } catch {
            // If it's not JSON, throw the text as error message
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
          }
        }
      }

      // If we get here, the response was successful
      // Try to parse response as JSON
      let result;
      try {
        result = await response.json();
        console.log('Post creation successful, response:', result);
        return result;
      } catch (parseError) {
        // If JSON parsing fails
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Server returned invalid response. Please try again later.');
      }
    } catch (fetchError) {
        clearTimeout(timeoutId); // Ensure timeout is cleared
        
        // Check if it's a timeout/abort error
        if (fetchError.name === 'AbortError' || fetchError.message.includes('aborted')) {
          throw new Error('Request timed out. Please check your connection and try again. If the problem persists, try uploading smaller images.');
        }
        
        // Re-throw other errors
        throw fetchError;
      }
    } catch (error) {
      console.error('Error creating post with files:', error);
      
      // Provide user-friendly error messages
      if (error.message.includes('timeout') || error.message.includes('timed out')) {
        throw new Error('Request timed out. Please check your connection and try again. If uploading images, try smaller file sizes.');
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      
      throw error;
    }
  },

  // Get all posts
  getPosts: async () => {
    try {
      const response = await apiRequest('/posts', {
        method: 'GET',
        skipAuth: true, // Posts can be fetched publicly
      });

      return response;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  },

  // Get post by ID
  getPostById: async (postId) => {
    try {
      const response = await apiRequest(`/posts/${postId}`, {
        method: 'GET',
        skipAuth: true,
      });

      return response;
    } catch (error) {
      console.error(`Error fetching post ${postId}:`, error);
      throw error;
    }
  },

  // Update a post
  updatePost: async (postId, postData) => {
    try {
      const response = await apiRequest(`/posts/${postId}`, {
        method: 'PATCH',
        body: JSON.stringify(postData),
        skipAuth: false,
      });

      return response;
    } catch (error) {
      console.error(`Error updating post ${postId}:`, error);
      throw error;
    }
  },

  // Delete a post
  deletePost: async (postId) => {
    try {
      const response = await apiRequest(`/posts/${postId}`, {
        method: 'DELETE',
        skipAuth: false,
      });

      return response;
    } catch (error) {
      console.error(`Error deleting post ${postId}:`, error);
      throw error;
    }
  }
};