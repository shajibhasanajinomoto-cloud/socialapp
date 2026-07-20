const mongoose = require("mongoose");
const Message = require("../models/Message");

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
