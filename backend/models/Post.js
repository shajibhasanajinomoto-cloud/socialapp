const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", default: null, index: true },
    content: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    reactions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        type: {
          type: String,
          enum: ["like", "love", "haha", "wow", "sad", "angry"],
          default: "like",
        },
      },
    ],
    commentsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

postSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);
