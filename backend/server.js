require("dotenv").config();

const express = require("express");
const cors = require("cors");
const dbConnect = require("./config/dbConfig");
const postsRoute = require("./routes/postsRoute");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/v1/home", (req, res) => {
  res.status(200).json({
    status: "success",
  });
});

// Posts routes
app.use("/api/v1/posts", postsRoute);

dbConnect();

app.listen(PORT, (err) => {
  return err
    ? console.log("Server is not running!")
    : console.log(`Server is running on port: ${PORT}.`);
});
