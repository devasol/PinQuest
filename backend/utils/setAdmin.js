require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

// Function to set a user as admin by email
const setAdmin = async (email) => {
  try {
    // Connect to database if not already connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URL);
    }
    
    // Find user by email
    const user = await User.findOne({ email: email });
    
    if (!user) {
      console.error("User not found with email:", email);
      return false;
    }
    
    // Update user's role to admin
    user.role = 'admin';
    await user.save();
    
    console.log("User", email, "has been set as admin. New role:", user.role);
    return true;
  } catch (error) {
    console.error("Error setting admin:", error);
    return false;
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
};

// If script is run directly
if (require.main === module) {
  const email = process.argv[2];
  
  if (!email) {
    console.log("Usage: node setAdmin.js <email>");
    console.log("Example: node setAdmin.js admin@example.com");
    process.exit(1);
  }
  
  console.log("Setting user as admin:", email);
  setAdmin(email)
    .then(success => {
      if (success) {
        console.log("Admin role successfully set!");
      } else {
        console.log("Failed to set admin role.");
      }
      process.exit(0);
    })
    .catch(err => {
      console.error("Error:", err);
      process.exit(1);
    });
}

module.exports = setAdmin;