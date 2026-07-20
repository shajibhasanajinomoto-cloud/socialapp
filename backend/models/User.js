const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    avatarUrl: { type: String, default: "" },
    bio: { type: String, default: "" },
    refreshToken: { type: String, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
