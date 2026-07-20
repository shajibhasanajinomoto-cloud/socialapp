const express = require("express");
const router = express.Router();
const {
  createPost,
  getFeed,
  getUserPosts,
  deletePost,
  toggleLike,
  addComment,
  getComments,
} = require("../controllers/postController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.post("/", protect, upload.single("image"), createPost);
router.get("/", protect, getFeed);
router.get("/user/:userId", protect, getUserPosts);
router.delete("/:id", protect, deletePost);
router.put("/:id/like", protect, toggleLike);
router.post("/:id/comments", protect, addComment);
router.get("/:id/comments", protect, getComments);

module.exports = router;
