const User = require("../models/User");
const Post = require("../models/Post");
const cloudinary = require("../config/cloudinary");

const uploadBufferToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    require("stream").Readable.from(buffer).pipe(uploadStream);
  });

// PUT /api/users/me/avatar
exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Image is required" });

    const result = await uploadBufferToCloudinary(req.file.buffer, "socialapp/avatars");

    const user = await User.findByIdAndUpdate(
      req.userId,
      { avatarUrl: result.secure_url },
      { new: true }
    );

    // Auto-create a feed post announcing the profile picture change (Facebook-style)
    await Post.create({
      userId: req.userId,
      content: `${user.name} updated their profile picture.`,
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
    });

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Failed to update avatar", error: err.message });
  }
};

// PUT /api/users/me/cover
exports.updateCover = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Image is required" });

    const result = await uploadBufferToCloudinary(req.file.buffer, "socialapp/covers");

    const user = await User.findByIdAndUpdate(
      req.userId,
      { coverImageUrl: result.secure_url },
      { new: true }
    );

    // Auto-create a feed post announcing the cover photo change (Facebook-style)
    await Post.create({
      userId: req.userId,
      content: `${user.name} updated their cover photo.`,
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
    });

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Failed to update cover photo", error: err.message });
  }
};

// GET /api/users/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("name email avatarUrl coverImageUrl bio");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user", error: err.message });
  }
};
