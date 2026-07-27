const User = require("../models/User");
const Post = require("../models/Post");
const Friendship = require("../models/Friendship");
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
    const user = await User.findById(req.params.id)
      .select(
        "name email avatarUrl coverImageUrl bio work education location hometown relationshipStatus relationshipSince familyMembers birthday"
      )
      .populate("familyMembers.user", "name avatarUrl");
    if (!user) return res.status(404).json({ message: "User not found" });

    const friendsCount = await Friendship.countDocuments({
      status: "accepted",
      $or: [{ requester: req.params.id }, { recipient: req.params.id }],
    });

    res.status(200).json({ user, friendsCount });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user", error: err.message });
  }
};

// PUT /api/users/me  (update bio, work, education, location, birthday)
exports.updateProfile = async (req, res) => {
  try {
    const { bio, work, education, location, hometown, relationshipStatus, relationshipSince, birthday } = req.body;
    const updates = {};
    if (bio !== undefined) updates.bio = bio;
    if (work !== undefined) updates.work = work;
    if (education !== undefined) updates.education = education;
    if (location !== undefined) updates.location = location;
    if (hometown !== undefined) updates.hometown = hometown;
    if (relationshipStatus !== undefined) updates.relationshipStatus = relationshipStatus;
    if (relationshipSince !== undefined) updates.relationshipSince = relationshipSince || null;
    if (birthday !== undefined) updates.birthday = birthday || null;

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true });
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
};

// PUT /api/users/me/family  (body: { familyMembers: [{ userId, relation }] })
exports.updateFamilyMembers = async (req, res) => {
  try {
    const { familyMembers } = req.body;
    if (!Array.isArray(familyMembers)) {
      return res.status(400).json({ message: "familyMembers must be an array" });
    }

    const cleaned = familyMembers
      .filter((m) => m.userId && m.relation)
      .map((m) => ({ user: m.userId, relation: m.relation.trim() }));

    const user = await User.findByIdAndUpdate(
      req.userId,
      { familyMembers: cleaned },
      { new: true }
    ).populate("familyMembers.user", "name avatarUrl");

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Failed to update family members", error: err.message });
  }
};

// PUT /api/users/me/push-token
exports.updatePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    if (!pushToken) return res.status(400).json({ message: "pushToken is required" });

    await User.findByIdAndUpdate(req.userId, { pushToken });
    res.status(200).json({ message: "Push token saved" });
  } catch (err) {
    res.status(500).json({ message: "Failed to save push token", error: err.message });
  }
};
