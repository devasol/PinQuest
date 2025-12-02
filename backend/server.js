require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss");
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
require("./config/passport");

const app = express();
const server = http.createServer(app);

// Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:", "http:"],
      scriptSrc: ["'self'", "https://*.cloudinary.com", "https://*.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
      connectSrc: ["'self'", "https://*.cloudinary.com", "wss:", "ws:"],
    },
  },
  referrerPolicy: { policy: 'no-referrer' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  }
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Slow down requests
const speedLimiter = require("express-slow-down")({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Begin slowing down after 50 requests
  delayMs: 500, // Slow down by 500ms
});
app.use(speedLimiter);

// Compression
app.use(compression());

// Data sanitization
app.use(mongoSanitize());
app.use((req, res, next) => {
  // Sanitize user inputs to prevent XSS
  if (req.body) {
    for (let key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    }
  }
  next();
});

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
        // In production, return an error:
        if (process.env.NODE_ENV === 'production') {
          callback(new Error('Not allowed by CORS'));
        } else {
          // For development, allow all origins temporarily
          callback(null, true);
        }
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
