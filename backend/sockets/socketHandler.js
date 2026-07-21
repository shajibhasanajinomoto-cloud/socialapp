const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const Notification = require("../models/Notification");

// userId -> socketId map for direct delivery
const onlineUsers = new Map();

function socketHandler(io) {
  // Authenticate every socket connection using the JWT access token
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication error: no token"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Authentication error: invalid token"));
    }
  });

  io.on("connection", (socket) => {
    onlineUsers.set(socket.userId, socket.id);
    console.log(`User connected: ${socket.userId}`);

    // Notify others this user is online (optional, for presence indicators)
    socket.broadcast.emit("user_online", { userId: socket.userId });

    socket.on("send_message", async ({ receiverId, content }) => {
      try {
        const conversationId = Message.buildConversationId(socket.userId, receiverId);

        const message = await Message.create({
          conversationId,
          senderId: socket.userId,
          receiverId,
          content,
          status: "sent",
        });

        // Send to receiver if online
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", message);
          message.status = "delivered";
          await message.save();
        }

        // Echo back to sender for optimistic UI confirmation
        socket.emit("message_sent", message);

        await Notification.create({
          recipient: receiverId,
          sender: socket.userId,
          type: "message",
        });
      } catch (err) {
        socket.emit("message_error", { error: err.message });
      }
    });

    socket.on("typing", ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user_typing", { userId: socket.userId });
      }
    });

    socket.on("mark_read", async ({ conversationId }) => {
      await Message.updateMany(
        { conversationId, receiverId: socket.userId, status: { $ne: "read" } },
        { $set: { status: "read" } }
      );
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(socket.userId);
      socket.broadcast.emit("user_offline", { userId: socket.userId });
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
}

module.exports = socketHandler;
