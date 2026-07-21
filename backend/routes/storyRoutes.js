const express = require("express");
const router = express.Router();
const {
  createStory,
  getStories,
  markStoryViewed,
  deleteStory,
} = require("../controllers/storyController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.get("/", protect, getStories);
router.post("/", protect, upload.single("image"), createStory);
router.put("/:id/view", protect, markStoryViewed);
router.delete("/:id", protect, deleteStory);

module.exports = router;
