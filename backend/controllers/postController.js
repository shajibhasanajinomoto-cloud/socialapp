const streamifier = require("stream");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const cloudinary = require("../config/cloudinary");

const uploadBufferToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "socialapp/posts" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.Readable.from(buffer).pipe(uploadStream);
  });

// POST /api/posts  (create)
exports.createPost = async (req, res) => {
  try {
    const { content, groupId } = req.body;
    let imageUrl = "";
    let imagePublicId = "";

    if (req.file) {
      const result = await uploadBufferToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
    }

    const post = await Post.create({
      userId: req.userId,
      content,
      imageUrl,
      imagePublicId,
      groupId: groupId || null,
    });

    const populated = await post.populate("userId", "name avatarUrl");
    res.status(201).json({ post: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to create post", error: err.message });
  }
};

// GET /api/posts?page=1&limit=10  (read feed, paginated)
exports.getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name avatarUrl");

    const total = await Post.countDocuments();

    res.status(200).json({
      posts,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + posts.length < total,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch feed", error: err.message });
  }
};

// GET /api/posts/user/:userId  (profile feed)
exports.getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate("userId", "name avatarUrl");
    res.status(200).json({ posts });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user posts", error: err.message });
  }
};

// DELETE /api/posts/:id
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    if (post.imagePublicId) {
      await cloudinary.uploader.destroy(post.imagePublicId);
    }

    await post.deleteOne();
    await Comment.deleteMany({ postId: post._id });

    res.status(200).json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete post", error: err.message });
  }
};

// PUT /api/posts/:id/react  (set/change/remove a reaction: like, love, haha, wow, sad, angry)
exports.toggleReaction = async (req, res) => {
  try {
    const { type } = req.body; // one of: like, love, haha, wow, sad, angry
    const validTypes = ["like", "love", "haha", "wow", "sad", "angry"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid reaction type" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const existingIndex = post.reactions.findIndex((r) => r.userId.toString() === req.userId);
    let action = "added";

    if (existingIndex >= 0) {
      if (post.reactions[existingIndex].type === type) {
        // Same reaction tapped again -> remove it
        post.reactions.splice(existingIndex, 1);
        action = "removed";
      } else {
        // Different reaction -> change it
        post.reactions[existingIndex].type = type;
        action = "changed";
      }
    } else {
      post.reactions.push({ userId: req.userId, type });
    }

    await post.save();

    if (action !== "removed" && post.userId.toString() !== req.userId) {
      await Notification.create({
        recipient: post.userId,
        sender: req.userId,
        type: "like",
        postId: post._id,
      });
    }

    // Summarize counts per reaction type for easy frontend rendering
    const counts = {};
    for (const r of post.reactions) counts[r.type] = (counts[r.type] || 0) + 1;

    res.status(200).json({ reactions: post.reactions, counts, totalCount: post.reactions.length, action });
  } catch (err) {
    res.status(500).json({ message: "Failed to react to post", error: err.message });
  }
};

// POST /api/posts/:id/comments
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "Comment content required" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = await Comment.create({
      postId: post._id,
      userId: req.userId,
      content,
    });

    post.commentsCount += 1;
    await post.save();

    if (post.userId.toString() !== req.userId) {
      await Notification.create({
        recipient: post.userId,
        sender: req.userId,
        type: "comment",
        postId: post._id,
      });
    }

    const populated = await comment.populate("userId", "name avatarUrl");
    res.status(201).json({ comment: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to add comment", error: err.message });
  }
};

// GET /api/posts/:id/comments
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.id })
      .sort({ createdAt: 1 })
      .populate("userId", "name avatarUrl");
    res.status(200).json({ comments });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch comments", error: err.message });
  }
};
