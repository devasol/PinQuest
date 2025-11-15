// Test script to verify post creation API endpoint
const API_BASE_URL = 'http://localhost:5000/api/v1';

// Mock token for testing - you'll need to replace this with a real token
const testToken = process.env.JWT_TOKEN || 'your-test-token-here';

async function testPostCreation() {
  console.log('Testing post creation API endpoint...');
  
  try {
    // Test location data with the correct format expected by the backend
    const testData = {
      title: "Test Post",
      description: "This is a test post with location data",
      location: {
        latitude: 40.7128,  // Example latitude
        longitude: -74.0060 // Example longitude
      },
      category: "general"
    };
    
    console.log('Sending POST request with data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(result, null, 2));
    
    if (response.status === 201 && result.status === 'success') {
      console.log('✅ Test passed! Post creation is working correctly.');
    } else {
      console.log('❌ Test failed! There may be an issue with post creation.');
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Also test with FormData
async function testPostCreationWithFormData() {
  console.log('\nTesting post creation API endpoint with FormData...');
  
  // This would be more complex to test from Node.js without a real file
  // This is just to show the expected format
  console.log('Expected FormData format:');
  console.log('- title: string');
  console.log('- description: string'); 
  console.log('- category: string');
  console.log('- location[latitude]: number');
  console.log('- location[longitude]: number');
  console.log('- image: File (optional)');
}

// Run tests
testPostCreation();
testPostCreationWithFormData();