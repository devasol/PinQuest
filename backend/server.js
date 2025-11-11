require("dotenv").config();

const express = require("express");
const cors = require("cors");
const passport = require('passport');
const http = require('http');
const socketIo = require('socket.io');
const dbConnect = require("./config/dbConfig");
const postsRoute = require("./routes/postsRoute");
const userRoute = require("./routes/userRoute");
const authRoute = require('./routes/auth');
const categoriesRoute = require('./routes/categoriesRoute');
const notificationsRoute = require('./routes/notificationsRoute');
const feedRoute = require('./routes/feedRoute');
const reportsRoute = require('./routes/reportsRoute');
const messagesRoute = require('./routes/messagesRoute');
const analyticsRoute = require('./routes/analyticsRoute');
require('./config/passport');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Enable CORS for all routes with proper configuration
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173", // Allow frontend origin
  credentials: true, // Allow cookies and credentials
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Handle preflight requests explicitly - use a catch-all middleware instead of wildcard
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:5173');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.sendStatus(200);
  } else {
    next();
  }
});

// Initialize Passport middleware
require('./config/passport')(passport);
app.use(passport.initialize());

// Health check endpoint
app.get("/api/v1/health", async (req, res) => {
  try {
    // Test database connection by trying to fetch a count
    const User = require('./models/User');
    const Post = require('./models/posts');
    
    // Perform a simple check to see if DB connections are working
    const userCount = await User.countDocuments();
    const postCount = await Post.countDocuments();
    
    res.status(200).json({
      status: "success",
      message: "Server is running",
      timestamp: new Date().toISOString(),
      database: "connected",
      counts: {
        users: userCount,
        posts: postCount
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: "error",
      message: "Service unavailable",
      error: error.message
    });
  }
});

// API home route
app.use("/api/v1/home", (req, res) => {
  res.status(200).json({
    status: "success",
  });
});

// Auth routes
app.use("/api/v1/auth", authRoute);

// Posts routes
app.use("/api/v1/posts", postsRoute);

app.use("/api/v1/users", userRoute);

// Categories routes
app.use("/api/v1/categories", categoriesRoute);

// Notifications routes
app.use("/api/v1/notifications", notificationsRoute);

// Feed routes
app.use("/api/v1/feed", feedRoute);

// Reports routes
app.use("/api/v1/reports", reportsRoute);

// Messages routes
app.use("/api/v1/messages", messagesRoute);

// Analytics routes
app.use("/api/v1/analytics", analyticsRoute);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join room based on user ID if authenticated
  socket.on('join-user-room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined room user_${userId}`);
  });

  // Join room based on post ID for post-specific updates
  socket.on('join-post-room', (postId) => {
    socket.join(`post_${postId}`);
    console.log(`Socket joined post room: post_${postId}`);
  });

  // Join room for global updates
  socket.on('join-global-room', () => {
    socket.join('global');
    console.log(`Socket joined global room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available to other modules
app.set('io', io);

dbConnect();

const PORT = process.env.PORT || 5000;
server.listen(PORT, (err) => {
  return err
    ? console.log("Server is not running!")
    : console.log(`Server is running on port: ${PORT}.`);
});
