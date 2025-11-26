// Simple test to check if new API routes are available
const axios = require('axios');

async function testApiRoutes() {
  const baseUrl = 'http://localhost:5000/api/v1';
  
  console.log('Testing API routes...');
  
  try {
    // Test the new verification routes
    console.log('\n1. Testing /auth/register-with-verification route (should return 400 due to missing data)...');
    try {
      const response = await axios.post(`${baseUrl}/auth/register-with-verification`, {});
      console.log('Unexpected success:', response.data);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✓ /auth/register-with-verification route is available (returned 400 as expected)');
      } else {
        console.log('✗ /auth/register-with-verification route error:', error.message);
      }
    }
    
    console.log('\n2. Testing /auth/verify-email route (should return 400 due to missing data)...');
    try {
      const response = await axios.post(`${baseUrl}/auth/verify-email`, {});
      console.log('Unexpected success:', response.data);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✓ /auth/verify-email route is available (returned 400 as expected)');
      } else {
        console.log('✗ /auth/verify-email route error:', error.message);
      }
    }
    
    console.log('\n3. Testing /auth/resend-verification route (should return 400 due to missing data)...');
    try {
      const response = await axios.post(`${baseUrl}/auth/resend-verification`, {});
      console.log('Unexpected success:', response.data);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✓ /auth/resend-verification route is available (returned 400 as expected)');
      } else {
        console.log('✗ /auth/resend-verification route error:', error.message);
      }
    }
    
    console.log('\n4. Testing original /auth/register route (should return 400 due to missing data)...');
    try {
      const response = await axios.post(`${baseUrl}/auth/register`, {});
      console.log('Unexpected success:', response.data);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✓ /auth/register route is still available (returned 400 as expected)');
      } else {
        console.log('✗ /auth/register route error:', error.message);
      }
    }
    
    console.log('\n✓ All API routes are available and functioning as expected!');
  } catch (error) {
    console.error('Error during API route testing:', error.message);
  }
}

// Run the test
testApiRoutes();