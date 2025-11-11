const mongoose = require("mongoose");

const dbConnect = async () => {
  try {
    const db = process.env.MONGODB_URI || "mongodb://localhost:27017/pin_quest";
    
    // Add connection options for better handling
    const conn = await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`Database connected successfully to: ${conn.connection.name}`);
    console.log(`Database host: ${conn.connection.host}`);
    
    // Add event listeners for connection status
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error("Database connection failed!", error);
    process.exit(1); // Exit the process if database connection fails
  }
};

module.exports = dbConnect;
