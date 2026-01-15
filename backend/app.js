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
const { globalErrorHandler } = require("./utils/errorHandler");
const logger = require("./utils/logger");
const { healthCheck, livenessCheck, readinessCheck, getMetrics } = require('./controllers/healthController');
require("./config/passport");

const app = express();
const server = http.createServer(app);

// Security Headers
// Security Headers
app.use(helmet({
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resource loading (images)
  crossOriginEmbedderPolicy: false, // Disable COEP to allow loading resources from other origins without explicit headers
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:", "http:"],
      scriptSrc: ["'self'", "https://*.cloudinary.com", "https://*.googleapis.com", "https://*.gstatic.com"],
      // Allow images from anywhere to ensure they load
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:", "*"],
      connectSrc: ["'self'", "https://*.cloudinary.com", "wss:", "ws:", process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : "'self'"],
      fontSrc: ["'self'", "https:", "data:", "https://*.gstatic.com"],
      objectSrc: ["'none'"], // Disallow embedding plugins
      frameSrc: ["'self'"], // Only allow frames from same origin
      frameAncestors: ["'none'"], // Prevent clickjacking by preventing embedding in frames
    },
  },
  referrerPolicy: { 
    policy: 'no-referrer-when-downgrade' // More reasonable than no-referrer
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  hidePoweredBy: true, // Remove X-Powered-By header
  ieNoOpen: true, // Set X-Download-Options header
  noSniff: true, // Set X-Content-Type-Options header to nosniff
  xssFilter: true, // Add basic XSS protection
  dnsPrefetchControl: true,
  frameguard: {
    action: 'deny' // Prevent embedding in frames
  }
}));

// Debug logging for uploads
app.use('/uploads', (req, res, next) => {
  console.log(`[Uploads Request] ${req.method} ${req.url}`);
  next();
});

// Rate Limiting - Only enable in production
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
  app.use(limiter);

  const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // Begin slowing down after 50 requests
    delayMs: () => 500, // Slow down by 500ms (using new format)
  });
  app.use(speedLimiter);
} else {
  console.log("Rate limiting disabled in development environment");
}

// Compression
app.use(compression());

// Data sanitization against NoSQL query injection
// Using alternative approach due to compatibility issues with Express 5.x
app.use((req, res, next) => {
  // Sanitize query parameters to prevent NoSQL injection
  if (req.query) {
    for (let key in req.query) {
      if (key.startsWith('$')) {
        delete req.query[key];
      }
    }
  }
  
  // Sanitize URL parameters
  if (req.params) {
    for (let key in req.params) {
      if (key.startsWith('$')) {
        delete req.params[key];
      }
    }
  }
  
  next();
});

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

// Add environment-specific CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if the origin is in our allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In production, return an error
      if (process.env.NODE_ENV === 'production') {
        console.log('CORS blocked:', origin);
        callback(new Error('Not allowed by CORS'));
      } else {
        // For development, allow all origins temporarily
        callback(null, true);
      }
    }
  },
  credentials: true, // Allow cookies and credentials
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "Accept", 
    "X-Requested-With",
    "X-HTTP-Method-Override"
  ],
  exposedHeaders: [
    "X-Total-Count",
    "X-Total-Pages",
    "X-Current-Page"
  ]
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve uploaded files from /uploads
const uploadsDir = path.join(__dirname, "uploads");
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Explicitly set headers for static files to avoid CORB/CORP blocking
  app.use("/uploads", 
    (req, res, next) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Access-Control-Allow-Origin", "*");
      next();
    },
    cors(), 
    express.static(uploadsDir, {
      setHeaders: (res) => {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        res.setHeader("Access-Control-Allow-Origin", "*");
      }
    })
  );
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

// Health check endpoints
app.get("/api/v1/health", healthCheck); // Comprehensive health check
app.get("/api/v1/health/live", livenessCheck); // Kubernetes-style liveness probe
app.get("/api/v1/health/ready", readinessCheck); // Kubernetes-style readiness probe
app.get("/api/v1/metrics", getMetrics); // Application metrics

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

// Connect to database
dbConnect();

// Global error handler middleware
app.use(globalErrorHandler);

// Export app and server separately for testing
module.exports = { app, server, io };

// Only start the server if this file is run directly (not imported)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, (err) => {
    return err
      ? console.log("Server is not running!")
      : console.log(`Server is running on port: ${PORT}.`);
  });
}