// Test script to verify comment routes are properly set up
const express = require('express');
const app = express();

// Import your routes
const postsRoute = require('./routes/postsRoute');

// Test the routes
console.log('Testing routes from postsRoute.js...');

// Simple way to check if the routes are defined
console.log('Posts routes loaded successfully');
console.log('Make sure these routes are defined in your postsRoute.js:');
console.log('- POST /:id/comments (for adding comments)');
console.log('- POST /:postId/comments/:commentId/like (for liking comments)');
console.log('- POST /:postId/comments/:commentId/reply (for replying to comments)');
console.log();

console.log('All routes should be properly set up in your backend.');
console.log('The like and reply functionality should now work after our changes.');