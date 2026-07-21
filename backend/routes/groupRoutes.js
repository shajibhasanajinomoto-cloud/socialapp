const express = require("express");
const router = express.Router();
const {
  createGroup,
  getGroups,
  getGroupDetails,
  joinGroup,
  leaveGroup,
  getGroupPosts,
} = require("../controllers/groupController");
const { protect } = require("../middleware/auth");

router.get("/", protect, getGroups);
router.post("/", protect, createGroup);
router.get("/:id", protect, getGroupDetails);
router.put("/:id/join", protect, joinGroup);
router.put("/:id/leave", protect, leaveGroup);
router.get("/:id/posts", protect, getGroupPosts);

module.exports = router;
