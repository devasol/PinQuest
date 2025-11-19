const mongoose = require("mongoose");
require("dotenv").config();

// Test MongoDB connection
const testConnection = async () => {
  try {
    const db =
      process.env.DATABASE_URI || "mongodb://localhost:27017/pin_quest";
    console.log("Attempting to connect to:", db);

    await mongoose.connect(db);
    console.log("Database connected successfully.");

    // Test the Post model
    const Post = require("./models/posts");

    // Create a test post
    const testPost = new Post({
      title: "Test Post",
      description: "This is a test post to verify the database connection",
      postedBy: "Test User",
    });

    const savedPost = await testPost.save();
    console.log("Test post saved successfully:", savedPost._id);

    // Retrieve all posts
    const allPosts = await Post.find();
    console.log("Total posts in database:", allPosts.length);

    // Close connection
    await mongoose.connection.close();
    console.log("Connection closed.");
  } catch (error) {
    console.error("Error:", error);
  }
};

testConnection();
