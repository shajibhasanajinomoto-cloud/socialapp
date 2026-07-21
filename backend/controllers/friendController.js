const Friendship = require("../models/Friendship");
const Notification = require("../models/Notification");
const User = require("../models/User");

// POST /api/friends/request/:userId
exports.sendRequest = async (req, res) => {
  try {
    const recipientId = req.params.userId;
    if (recipientId === req.userId) {
      return res.status(400).json({ message: "Cannot send a friend request to yourself" });
    }

    const existing = await Friendship.findOne({
      $or: [
        { requester: req.userId, recipient: recipientId },
        { requester: recipientId, recipient: req.userId },
      ],
    });
    if (existing) {
      return res.status(409).json({ message: "Friendship already exists or is pending", status: existing.status });
    }

    const friendship = await Friendship.create({ requester: req.userId, recipient: recipientId });

    await Notification.create({
      recipient: recipientId,
      sender: req.userId,
      type: "friend_request",
    });

    res.status(201).json({ friendship });
  } catch (err) {
    res.status(500).json({ message: "Failed to send friend request", error: err.message });
  }
};

// PUT /api/friends/accept/:requestId
exports.acceptRequest = async (req, res) => {
  try {
    const friendship = await Friendship.findById(req.params.requestId);
    if (!friendship) return res.status(404).json({ message: "Request not found" });

    if (friendship.recipient.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized to accept this request" });
    }

    friendship.status = "accepted";
    await friendship.save();

    await Notification.create({
      recipient: friendship.requester,
      sender: req.userId,
      type: "friend_accept",
    });

    res.status(200).json({ friendship });
  } catch (err) {
    res.status(500).json({ message: "Failed to accept request", error: err.message });
  }
};

// PUT /api/friends/reject/:requestId
exports.rejectRequest = async (req, res) => {
  try {
    const friendship = await Friendship.findById(req.params.requestId);
    if (!friendship) return res.status(404).json({ message: "Request not found" });

    if (friendship.recipient.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized to reject this request" });
    }

    friendship.status = "rejected";
    await friendship.save();
    res.status(200).json({ friendship });
  } catch (err) {
    res.status(500).json({ message: "Failed to reject request", error: err.message });
  }
};

// DELETE /api/friends/:userId  (unfriend)
exports.unfriend = async (req, res) => {
  try {
    await Friendship.findOneAndDelete({
      status: "accepted",
      $or: [
        { requester: req.userId, recipient: req.params.userId },
        { requester: req.params.userId, recipient: req.userId },
      ],
    });
    res.status(200).json({ message: "Unfriended" });
  } catch (err) {
    res.status(500).json({ message: "Failed to unfriend", error: err.message });
  }
};

// GET /api/friends  (accepted friends list)
exports.getFriends = async (req, res) => {
  try {
    const friendships = await Friendship.find({
      status: "accepted",
      $or: [{ requester: req.userId }, { recipient: req.userId }],
    })
      .populate("requester", "name avatarUrl")
      .populate("recipient", "name avatarUrl");

    const friends = friendships.map((f) =>
      f.requester._id.toString() === req.userId ? f.recipient : f.requester
    );

    res.status(200).json({ friends });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch friends", error: err.message });
  }
};

// GET /api/friends/requests  (pending requests received)
exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await Friendship.find({
      recipient: req.userId,
      status: "pending",
    }).populate("requester", "name avatarUrl");

    res.status(200).json({ requests });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch requests", error: err.message });
  }
};

// GET /api/friends/status/:userId  (friendship status with a specific user)
exports.getFriendshipStatus = async (req, res) => {
  try {
    const friendship = await Friendship.findOne({
      $or: [
        { requester: req.userId, recipient: req.params.userId },
        { requester: req.params.userId, recipient: req.userId },
      ],
    });

    if (!friendship) return res.status(200).json({ status: "none" });
    res.status(200).json({ status: friendship.status, friendshipId: friendship._id, requester: friendship.requester });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch friendship status", error: err.message });
  }
};
