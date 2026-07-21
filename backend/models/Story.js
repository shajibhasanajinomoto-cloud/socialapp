const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mediaUrl: { type: String, required: true },
    mediaPublicId: { type: String, default: "" },
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdAt: { type: Date, default: Date.now, expires: "24h" }, // TTL: auto-deleted after 24 hours
  }
);

module.exports = mongoose.model("Story", storySchema);
