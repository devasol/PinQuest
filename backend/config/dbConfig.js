const mongoose = require("mongoose");

const dbConnect = async () => {
  try {
    const db =
      process.env.DATABASE_URI || "mongodb://localhost:27017/pin_quest";
    await mongoose.connect(db);
    console.log("Database connected successfully.");
  } catch (error) {
    console.log("Database can't connect!", error);
  }
};

module.exports = dbConnect;
