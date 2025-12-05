/**
 * Test script to verify post creation with images works correctly
 */
const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Mock image data for testing (base64 encoded small PNG)
const mockImageData = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

async function testPostCreation() {
  console.log("Testing post creation with images...");
  
  try {
    // Create form data for the post
    const form = new FormData();
    form.append('title', 'Test Post with Image');
    form.append('description', 'This is a test post to verify image upload functionality');
    form.append('category', 'test');
    
    // Create a mock image file (in a real scenario, you'd read an actual image file)
    const imageBuffer = Buffer.from(mockImageData, 'base64');
    form.append('images', imageBuffer, {
      filename: 'test-image.png',
      contentType: 'image/png'
    });
    
    // Mock location data
    form.append('location[latitude]', '40.7128');
    form.append('location[longitude]', '-74.0060');
    
    // Set content-type header for form data (this will be set automatically by form.getHeaders)
    const headers = {
      ...form.getHeaders(),
      'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with a real token if needed
    };
    
    // Replace with your actual backend URL for testing
    const response = await axios.post(
      'http://localhost:5000/api/v1/posts', 
      form,
      {
        headers,
        timeout: 60000 // 60 second timeout for testing
      }
    );
    
    console.log('Post created successfully:', response.data);
    console.log('Post ID:', response.data.data._id);
    console.log('Post image:', response.data.data.image);
    console.log('Post images array:', response.data.data.images);
    
  } catch (error) {
    console.error('Error creating post:', error.response?.data || error.message);
  }
}

// If running this file directly
if (require.main === module) {
  testPostCreation();
}

module.exports = { testPostCreation };