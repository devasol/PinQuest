// Posts API service
import { apiRequest } from './api.jsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const postsApi = {
  // Create a new post
  createPost: async (postData) => {
    try {
      const response = await apiRequest('/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
        skipAuth: false,
      });

      return response;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  // Create a new post with form data (for file uploads)
  createPostWithFiles: async (formData) => {
    try {
      // For file uploads, we need to use fetch directly since FormData can't use the apiRequest function
      // But we can still use the token refresh logic from api.jsx
      const { getFreshToken } = await import('./api.jsx');
      let token = await getFreshToken();
      
      if (!token) {
        // If we couldn't get a fresh token, try to get current token
        token = localStorage.getItem("token");
        if (!token) {
          throw new Error('Authentication required. Please login again.');
        }
      }

      // First attempt with the initial token
      let response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

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
          const refreshedToken = await getFreshToken();
          if (refreshedToken) {
            // Retry the request with the fresh token
            const retryResponse = await fetch(`${API_BASE_URL}/posts`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${refreshedToken}`,
              },
              body: formData,
            });
            
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
          } else {
            throw new Error('Token expired and could not be refreshed.');
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

      // Try to parse response as JSON
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        // If JSON parsing fails
        throw new Error('Server returned invalid response. Please try again later.');
      }
      return result;
    } catch (error) {
      console.error('Error creating post with files:', error);
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