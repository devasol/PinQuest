const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values but enforces uniqueness for non-null values
  },
  avatar: {
    type: String, // URL to user's avatar
  },
  favorites: [{
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    },
    dateAdded: {
      type: Date,
      default: Date.now
    }
  }],
  following: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dateAdded: {
      type: Date,
      default: Date.now
    }
  }],
  followers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dateAdded: {
      type: Date,
      default: Date.now
    }
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true
});

// Add virtual field for favorites count
userSchema.virtual('favoritesCount').get(function() {
  return this.favorites ? this.favorites.length : 0;
});

// Add virtual field for following count
userSchema.virtual('followingCount').get(function() {
  return this.following ? this.following.length : 0;
});

// Add virtual field for followers count
userSchema.virtual('followersCount').get(function() {
  return this.followers ? this.followers.length : 0;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified (not on other field updates)
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;