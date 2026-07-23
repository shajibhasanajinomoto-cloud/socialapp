const mongoose = require("mongoose");
const Message = require("../models/Message");
const cloudinary = require("../config/cloudinary");

const uploadBufferToCloudinary = (buffer, folder, resourceType) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    require("stream").Readable.from(buffer).pipe(uploadStream);
  });

// POST /api/messages/upload-media  (uploads an image or voice note, returns the URL)
// The frontend then sends this URL over the socket as part of the chat message.
exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "File is required" });

    const mediaType = req.body.mediaType === "voice" ? "voice" : "image";
    const resourceType = mediaType === "voice" ? "video" : "image"; // Cloudinary treats audio under "video"

    const result = await uploadBufferToCloudinary(req.file.buffer, "socialapp/chat-media", resourceType);

    res.status(200).json({ mediaUrl: result.secure_url, mediaType });
  } catch (err) {
    res.status(500).json({ message: "Failed to upload media", error: err.message });
  }
};

// GET /api/messages/:otherUserId  (fetch conversation history)
exports.getConversation = async (req, res) => {
  try {
    const conversationId = Message.buildConversationId(req.userId, req.params.otherUserId);

    const messages = await Message.find({ conversationId }).sort({ timestamp: 1 });

    res.status(200).json({ messages });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch conversation", error: err.message });
  }
};

// GET /api/messages  (list latest message per conversation, i.e. chat list)
exports.getChatList = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }],
        },
      },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$conversationId",
          lastMessage: { $first: "$$ROOT" },
        },
      },
      { $sort: { "lastMessage.timestamp": -1 } },
    ]);

    res.status(200).json({ chats: messages });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch chat list", error: err.message });
  }
};
