require("dotenv").config();

const express = require("express");
const cors = require("cors");
const passport = require("passport");
const path = require("path");
const fs = require("fs");
const http = require("http");
const socketIo = require("socket.io");
const dbConnect = require("./config/dbConfig");
const postsRoute = require("./routes/postsRoute");
const userRoute = require("./routes/userRoute");
const authRoute = require("./routes/auth");
const adminRoute = require("./routes/adminRoute");
const categoriesRoute = require("./routes/categoriesRoute");
const notificationsRoute = require("./routes/notificationsRoute");
const feedRoute = require("./routes/feedRoute");
const reportsRoute = require("./routes/reportsRoute");
const messagesRoute = require("./routes/messagesRoute");
const analyticsRoute = require("./routes/analyticsRoute");
const mapsRoute = require("./routes/mapsRoute");
require("./config/passport");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Enable CORS for all routes with flexible origin handling
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5174", // Common Vite default port
  "http://localhost:3000", // Common React dev port
  "http://localhost:3001", // Alternative React dev port
  "http://localhost:8080", // Alternative dev port
  "http://localhost:8000", // Alternative dev port
  "http://localhost:4173", // Alternative Vite port
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Check if the origin is in our allowed list
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(null, true); // For development, allow all origins
        // In production, you should return an error:
        // callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Allow cookies and credentials
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve uploaded files from /uploads
const uploadsDir = path.join(__dirname, "uploads");
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir));
} catch (e) {
  console.error(
    "Failed to ensure uploads directory exists or mount static:",
    e
  );
}

// The cors middleware we set up above should handle preflight requests automatically
// No need for explicit OPTIONS route that causes path-to-regexp issues

// Initialize Passport middleware
require("./config/passport")(passport);
app.use(passport.initialize());

// Health check endpoint
app.get("/api/v1/health", async (req, res) => {
  try {
    // Test database connection by trying to fetch a count
    const User = require("./models/User");
    const Post = require("./models/posts");

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
        posts: postCount,
      },
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({
      status: "error",
      message: "Service unavailable",
      error: error.message,
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

// Maps routes
app.use("/api/v1/maps", mapsRoute);

// Admin routes
app.use("/api/v1/admin", adminRoute);

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Join room based on user ID if authenticated
  socket.on("join-user-room", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined room user_${userId}`);
  });

  // Join room based on post ID for post-specific updates
  socket.on("join-post-room", (postId) => {
    socket.join(`post_${postId}`);
    console.log(`Socket joined post room: post_${postId}`);
  });

  // Join room for global updates
  socket.on("join-global-room", () => {
    socket.join("global");
    console.log(`Socket joined global room`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Make io available to other modules
app.set("io", io);

dbConnect();

// Global error handler: return JSON for any unhandled errors (prevents Express HTML error page)
app.use((err, req, res, next) => {
  console.error("Unhandled error caught by global handler:", err);

  // Multer-specific or Cloudinary upload errors may include a code or message
  const statusCode = err && err.status ? err.status : 500;

  // Prefer err.message when available, otherwise stringify useful parts
  let message = "Internal server error";
  if (err && err.message) message = err.message;
  else if (err && typeof err === "object") {
    try {
      message = JSON.stringify(err).slice(0, 1000);
    } catch (e) {
      message = String(err);
    }
  }

  // Provide a consistent JSON response for all errors
  res.status(statusCode).json({
    status: "error",
    message,
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, (err) => {
  return err
    ? console.log("Server is not running!")
    : console.log(`Server is running on port: ${PORT}.`);
});
