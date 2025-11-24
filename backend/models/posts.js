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
    url: String, // Public URL of the image
    publicId: String, // Cloudinary public ID for deletion purposes
  },
  images: [
    {
      url: String,
      publicId: String,
    },
  ],
  likes: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
  ],
  likesCount: {
    type: Number,
    default: 0,
  },
  // Ratings given by users (each user can leave one rating per post)
  ratings: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
    },
  ],
  // Cached aggregates for convenience
  averageRating: {
    type: Number,
    default: 0,
  },
  totalRatings: {
    type: Number,
    default: 0,
  },
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      text: String,
      date: { type: Date, default: Date.now },
      likes: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        date: { type: Date, default: Date.now }
      }],
      likesCount: {
        type: Number,
        default: 0
      },
      replies: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          text: String,
          date: { type: Date, default: Date.now }
        }
      ],
      repliesCount: {
        type: Number,
        default: 0
      }
    },
  ],
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  datePosted: {
    type: Date,
    default: Date.now,
  },
  category: {
    type: String,
    default: "general",
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: "2dsphere",
    },
    latitude: Number,
    longitude: Number,
  },
});

// Virtual to get likes count
postSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

// Middleware to update likesCount before saving
postSchema.pre("save", function (next) {
  this.likesCount = this.likes.length;
  next();
});

module.exports = mongoose.model("Post", postSchema);
