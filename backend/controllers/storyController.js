const Story = require("../models/Story");
const cloudinary = require("../config/cloudinary");

const uploadBufferToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "socialapp/stories" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    require("stream").Readable.from(buffer).pipe(uploadStream);
  });

// POST /api/stories  (create, image required)
exports.createStory = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Image is required for a story" });

    const result = await uploadBufferToCloudinary(req.file.buffer);

    const story = await Story.create({
      userId: req.userId,
      mediaUrl: result.secure_url,
      mediaPublicId: result.public_id,
    });

    const populated = await story.populate("userId", "name avatarUrl");
    res.status(201).json({ story: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to create story", error: err.message });
  }
};

// GET /api/stories  (active stories, grouped by user)
exports.getStories = async (req, res) => {
  try {
    const stories = await Story.find().sort({ createdAt: -1 }).populate("userId", "name avatarUrl");

    // Group by user so the frontend can show one "story ring" per person
    const grouped = {};
    for (const story of stories) {
      const uid = story.userId._id.toString();
      if (!grouped[uid]) {
        grouped[uid] = { user: story.userId, stories: [] };
      }
      grouped[uid].stories.push(story);
    }

    res.status(200).json({ storyGroups: Object.values(grouped) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stories", error: err.message });
  }
};

// PUT /api/stories/:id/view
exports.markStoryViewed = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: "Story not found" });

    if (!story.viewers.some((id) => id.toString() === req.userId)) {
      story.viewers.push(req.userId);
      await story.save();
    }

    res.status(200).json({ viewersCount: story.viewers.length });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark story as viewed", error: err.message });
  }
};

// DELETE /api/stories/:id
exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: "Story not found" });

    if (story.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized to delete this story" });
    }

    if (story.mediaPublicId) await cloudinary.uploader.destroy(story.mediaPublicId);
    await story.deleteOne();

    res.status(200).json({ message: "Story deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete story", error: err.message });
  }
};
