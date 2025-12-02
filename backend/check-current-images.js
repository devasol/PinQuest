const mongoose = require("mongoose");
require("dotenv").config();

// Import Post model
const Post = require("./models/posts");

// Function to connect and check current images
async function checkCurrentImages() {
  try {
    // Connect to database directly with the connection string
    const db = process.env.MONGODB_URL || process.env.MONGODB_URI || "mongodb://localhost:27017/pin_quest";
    
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log("Connected to database, checking current images...");
    
    // Find a few sample posts to check current image URLs
    const posts = await Post.find({}).limit(5);
    
    console.log(`Found ${posts.length} sample posts. Current image URLs:`);
    
    for (const post of posts) {
      console.log(`Post: ${post.title}`);
      console.log(`  - Current Image URL: ${post.image?.url || 'No image URL'}`);
      console.log(`  - Current Images Array: ${post.images?.length || 0} images`);
      if (post.images && post.images.length > 0) {
        console.log(`    First image: ${post.images[0]?.url || 'No URL'}`);
      }
      console.log('---');
    }
    
    // Check total number of posts
    const totalPosts = await Post.countDocuments({});
    console.log(`\nTotal number of posts in database: ${totalPosts}`);
    
    mongoose.connection.close();
    console.log("Database connection closed.");
    
  } catch (error) {
    console.error("Error checking current images:", error);
    mongoose.connection.close();
  }
}

// Run the check function
checkCurrentImages();