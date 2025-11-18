const axios = require('axios');

// Test the new saved locations API endpoints
const API_BASE_URL = 'http://localhost:5000/api/v1';

// You'll need a valid authentication token to test these endpoints
// This is just an example structure - you'll need a real token
const testToken = process.env.TEST_TOKEN || 'your-test-token-here';

async function testSavedLocationsAPI() {
  console.log('Testing Saved Locations API endpoints...');
  
  // Test data
  const testLocation = {
    id: 'test-location-1',
    name: 'Test Location',
    latitude: 40.7128,
    longitude: -74.0060,
    address: 'New York, NY',
    placeId: 'test-place-id',
    type: 'landmark',
    category: 'tourist',
    description: 'A test location for API testing'
  };
  
  try {
    // Test adding a saved location
    console.log('\n1. Testing POST /users/saved-locations');
    const addResponse = await axios.post(
      `${API_BASE_URL}/users/saved-locations`,
      testLocation,
      {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Add saved location response:', addResponse.data);
    
    // Test getting saved locations
    console.log('\n2. Testing GET /users/saved-locations');
    const getResponse = await axios.get(
      `${API_BASE_URL}/users/saved-locations`,
      {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Get saved locations response:', getResponse.data);
    
    // Test removing a saved location
    console.log('\n3. Testing DELETE /users/saved-locations/:locationId');
    const deleteResponse = await axios.delete(
      `${API_BASE_URL}/users/saved-locations/test-location-1`,
      {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Remove saved location response:', deleteResponse.data);
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Error during testing:', error.response?.data || error.message);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testSavedLocationsAPI();
}

module.exports = { testSavedLocationsAPI };