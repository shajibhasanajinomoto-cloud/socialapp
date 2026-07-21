const User = require("../models/User");
const Post = require("../models/Post");

// GET /api/search?q=keyword
exports.search = async (req, res) => {
  try {
    const q = req.query.q;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const regex = new RegExp(q.trim(), "i"); // case-insensitive partial match

    const [users, posts] = await Promise.all([
      User.find({ name: regex }).select("name avatarUrl bio").limit(20),
      Post.find({ content: regex }).populate("userId", "name avatarUrl").limit(20).sort({ createdAt: -1 }),
    ]);

    res.status(200).json({ users, posts });
  } catch (err) {
    res.status(500).json({ message: "Search failed", error: err.message });
  }
};
