const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title input is required"],
  },
  description: {
    type: String,
    required: [true, "Description input is required"],
  },
  image: {
    type: String,
  },
  likes: {
    type: Number,
    default: 0,
  },
  comments: [{
    text: String,
    postedBy: String,
    date: { type: Date, default: Date.now }
  }],
  postedBy: {
    type: String,
  },
  datePosted: {
    type: Date,
    default: Date.now,
  },
  location: {
    latitude: Number,
    longitude: Number,
  }
});

module.exports = mongoose.model("Post", postSchema);
