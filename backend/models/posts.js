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
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  likesCount: {
    type: Number,
    default: 0,
  },
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      text: String,
      date: { type: Date, default: Date.now },
    },
  ],
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  datePosted: {
    type: Date,
    default: Date.now,
  },
  category: {
    type: String,
    default: "general"
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    },
    latitude: Number,
    longitude: Number,
  },
});

// Virtual to get likes count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Middleware to update likesCount before saving
postSchema.pre('save', function(next) {
  this.likesCount = this.likes.length;
  next();
});

module.exports = mongoose.model("Post", postSchema);
