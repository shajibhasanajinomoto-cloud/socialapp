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
    coverImageUrl: { type: String, default: "" },
    bio: { type: String, default: "" },
    work: { type: String, default: "" },
    education: { type: String, default: "" },
    location: { type: String, default: "" },
    hometown: { type: String, default: "" },
    relationshipStatus: {
      type: String,
      enum: ["", "Single", "In a relationship", "Engaged", "Married", "It's complicated", "Separated", "Divorced", "Widowed"],
      default: "",
    },
    relationshipSince: { type: Date, default: null },
    familyMembers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        relation: { type: String, trim: true },
      },
    ],
    birthday: { type: Date, default: null },
    refreshToken: { type: String, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
