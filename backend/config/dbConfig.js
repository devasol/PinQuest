const mongoose = require("mongoose");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const dbConnect = async () => {
  try {
    const db = process.env.MONGODB_URL || process.env.MONGODB_URI || "mongodb://localhost:27017/pin_quest";
    
    // Add secure connection options
    const conn = await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
      // Add security options
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      // If using MongoDB Atlas or other cloud service, enable SSL
      ssl: db.includes('mongodb+srv') || db.includes('cluster') || process.env.NODE_ENV === 'production'
    });
    
    console.log(`Database connected successfully to: ${conn.connection.name}`);
    console.log(`Database host: ${conn.connection.host}`);
    console.log(`Database port: ${conn.connection.port}`);
    
    // Create default admin user if none exists
    await createDefaultAdmin();
    
    // Add event listeners for connection status
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    // Add additional security event listeners
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
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

// Function to create default admin user
const createDefaultAdmin = async () => {
  try {
    // Check if a specific default admin user already exists
    const existingDefaultAdmin = await User.findOne({ email: 'admin@pinquest.com' });
    
    if (!existingDefaultAdmin) {
      // Hash the default admin password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Create default admin user
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@pinquest.com',
        password: hashedPassword,
        role: 'admin',
        isVerified: true
      });
      
      await adminUser.save();
      console.log('Default admin user created successfully!');
      console.log('Email: admin@pinquest.com');
      console.log('Password: admin123');
    } else if (existingDefaultAdmin.role !== 'admin') {
      // If the default admin exists but doesn't have admin role, update it
      existingDefaultAdmin.role = 'admin';
      await existingDefaultAdmin.save();
      console.log('Default admin user role updated successfully!');
      console.log('Email: admin@pinquest.com');
      console.log('Password: admin123');
    } else {
      console.log('Admin user already exists with admin role, skipping creation.');
    }
  } catch (error) {
    console.error('Error creating default admin user:', error);
  }
};

module.exports = dbConnect;
