require("dotenv").config();

const express = require("express");
const dbConnect = require("./config/dbConfig");
const app = express();

const PORT = process.env.PORT || 5000;

app.use("/api/v1/home", (req, res) => {
  res.status(200).json({
    status: "success",
  });
});

dbConnect();

app.listen(PORT, (err) => {
  return err
    ? console.log("Server is not running!")
    : console.log(`Server is running on port: ${PORT}.`);
});
