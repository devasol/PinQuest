const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

// Test the database models
async function testDatabase() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/pinquest-test');
    
    console.log('Testing User model with verification fields...');
    
    // Check if verification fields are properly defined
    const userSchema = User.schema;
    console.log('Verification code field exists:', userSchema.path('verificationCode') !== undefined);
    console.log('Verification code expires field exists:', userSchema.path('verificationCodeExpires') !== undefined);
    console.log('Is verified field exists:', userSchema.path('isVerified') !== undefined);
    
    console.log('Database test completed successfully!');
  } catch (error) {
    console.error('Database test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the test
testDatabase();