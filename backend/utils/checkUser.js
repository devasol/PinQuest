require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

// Function to check a user's role by email
const checkUser = async (email) => {
  try {
    // Connect to database if not already connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URL);
    }
    
    // Find user by email
    const user = await User.findOne({ email: email });
    
    if (!user) {
      console.error("User not found with email:", email);
      return null;
    }
    
    console.log("User found:", {
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
      _id: user._id
    });
    
    return user;
  } catch (error) {
    console.error("Error checking user:", error);
    return null;
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
};

// If script is run directly
if (require.main === module) {
  const email = process.argv[2];
  
  if (!email) {
    console.log("Usage: node checkUser.js <email>");
    console.log("Example: node checkUser.js admin@example.com");
    process.exit(1);
  }
  
  console.log("Checking user:", email);
  checkUser(email)
    .then(user => {
      if (user) {
        console.log("User details retrieved successfully!");
      } else {
        console.log("Failed to retrieve user details.");
      }
      process.exit(0);
    })
    .catch(err => {
      console.error("Error:", err);
      process.exit(1);
    });
}

module.exports = checkUser;