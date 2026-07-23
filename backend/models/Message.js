const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, default: "" },
    mediaUrl: { type: String, default: "" },
    mediaType: { type: String, enum: ["text", "image", "voice"], default: "text" },
    status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
  },
  { timestamps: { createdAt: "timestamp", updatedAt: false } }
);

messageSchema.index({ conversationId: 1, timestamp: 1 });

// Deterministic conversation id regardless of who sent first
messageSchema.statics.buildConversationId = (idA, idB) => {
  return [idA.toString(), idB.toString()].sort().join("_");
};

module.exports = mongoose.model("Message", messageSchema);
