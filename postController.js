const streamifier = require("stream");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
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
    const { content } = req.body;
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

// PUT /api/posts/:id/like  (toggle like)
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const alreadyLiked = post.likes.some((id) => id.toString() === req.userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== req.userId);
    } else {
      post.likes.push(req.userId);
    }

    await post.save();
    res.status(200).json({ likesCount: post.likes.length, liked: !alreadyLiked });
  } catch (err) {
    res.status(500).json({ message: "Failed to toggle like", error: err.message });
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
