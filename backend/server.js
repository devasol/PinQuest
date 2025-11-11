require("dotenv").config();

const express = require("express");
const cors = require("cors");
const passport = require('passport');
const dbConnect = require("./config/dbConfig");
const postsRoute = require("./routes/postsRoute");
const userRoute = require("./routes/userRoute");
const authRoute = require('./routes/auth');
const categoriesRoute = require('./routes/categoriesRoute');
const notificationsRoute = require('./routes/notificationsRoute');
require('./config/passport');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport middleware
require('./config/passport')(passport);
app.use(passport.initialize());

// Routes
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

dbConnect();

app.listen(PORT, (err) => {
  return err
    ? console.log("Server is not running!")
    : console.log(`Server is running on port: ${PORT}.`);
});
