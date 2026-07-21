const Group = require("../models/Group");
const Post = require("../models/Post");

// POST /api/groups
exports.createGroup = async (req, res) => {
  try {
    const { name, description, privacy } = req.body;
    if (!name) return res.status(400).json({ message: "Group name is required" });

    const group = await Group.create({
      name,
      description,
      privacy: privacy === "private" ? "private" : "public",
      creator: req.userId,
      members: [req.userId],
      admins: [req.userId],
    });

    res.status(201).json({ group });
  } catch (err) {
    res.status(500).json({ message: "Failed to create group", error: err.message });
  }
};

// GET /api/groups  (all public groups + groups the user is a member of)
exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      $or: [{ privacy: "public" }, { members: req.userId }],
    })
      .sort({ createdAt: -1 })
      .populate("creator", "name avatarUrl");

    res.status(200).json({ groups });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch groups", error: err.message });
  }
};

// GET /api/groups/:id
exports.getGroupDetails = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("creator", "name avatarUrl")
      .populate("members", "name avatarUrl");

    if (!group) return res.status(404).json({ message: "Group not found" });
    res.status(200).json({ group });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch group", error: err.message });
  }
};

// PUT /api/groups/:id/join
exports.joinGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!group.members.some((id) => id.toString() === req.userId)) {
      group.members.push(req.userId);
      await group.save();
    }

    res.status(200).json({ message: "Joined group", membersCount: group.members.length });
  } catch (err) {
    res.status(500).json({ message: "Failed to join group", error: err.message });
  }
};

// PUT /api/groups/:id/leave
exports.leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    group.members = group.members.filter((id) => id.toString() !== req.userId);
    group.admins = group.admins.filter((id) => id.toString() !== req.userId);
    await group.save();

    res.status(200).json({ message: "Left group" });
  } catch (err) {
    res.status(500).json({ message: "Failed to leave group", error: err.message });
  }
};

// GET /api/groups/:id/posts
exports.getGroupPosts = async (req, res) => {
  try {
    const posts = await Post.find({ groupId: req.params.id })
      .sort({ createdAt: -1 })
      .populate("userId", "name avatarUrl");

    res.status(200).json({ posts });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch group posts", error: err.message });
  }
};
