const Notification = require("../models/Notification");

// GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("sender", "name avatarUrl")
      .populate("postId", "content imageUrl");

    res.status(200).json({ notifications });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notifications", error: err.message });
  }
};

// PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.userId },
      { read: true }
    );
    res.status(200).json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark as read", error: err.message });
  }
};

// PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.userId, read: false }, { read: true });
    res.status(200).json({ message: "All marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark all as read", error: err.message });
  }
};

// GET /api/notifications/unread-count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.userId, read: false });
    res.status(200).json({ count });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch unread count", error: err.message });
  }
};
