const axios = require('axios');

// This is a test script to verify the admin routes functionality
async function testAdminRoutes() {
  try {
    const BASE_URL = 'http://localhost:5000/api/v1';
    
    console.log('Testing admin routes...');
    
    // First, let's try to get all users (this requires admin privileges)
    // We need a valid admin token for this
    const token = process.env.ADMIN_TOKEN || 'your-admin-token-here';
    
    if (!token || token === 'your-admin-token-here') {
      console.log('No admin token provided. Please set ADMIN_TOKEN environment variable or have a valid token in localStorage.');
      console.log('You need to login with admin credentials first to get a valid token.');
      return;
    }
    
    console.log('Testing GET /admin/users with provided token...');
    try {
      const getUsersResponse = await axios.get(`${BASE_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Successfully fetched users:', getUsersResponse.data.data.length, 'users found');
    } catch (error) {
      console.error('Error fetching users:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        console.log('Token might be expired or invalid. Please login again to get a new token.');
      }
      return;
    }
    
    // Now let's try to get a user ID to delete
    try {
      const usersResponse = await axios.get(`${BASE_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (usersResponse.data.data && usersResponse.data.data.length > 0) {
        const userIdToDelete = usersResponse.data.data[0]._id;
        console.log('Attempting to delete user with ID:', userIdToDelete);
        
        const deleteResponse = await axios.delete(`${BASE_URL}/admin/users/${userIdToDelete}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('User deleted successfully:', deleteResponse.data.message);
      } else {
        console.log('No users available to delete for testing.');
      }
    } catch (error) {
      console.error('Error deleting user:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('Error in testAdminRoutes:', error.message);
  }
}

// Check if we have all the required dependencies
try {
  testAdminRoutes();
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('Missing required modules. Please run: npm install axios mongoose');
  } else {
    console.error('Error:', error.message);
  }
}