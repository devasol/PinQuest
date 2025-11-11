const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
  },
  email: {
    type: String,
    required: [true, "Email field is required."],
    validate: validator("email"),
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Password field is required."],
    maxlength: 20,
    minlength: 8,
  },
  passwordConfirm: {
    type: String,
    validate: {
      validator: function (value) {
        return this.password === value;
      },
    },
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
