const express = require("express");
const router = express.Router();
const { getConversation, getChatList } = require("../controllers/messageController");
const { protect } = require("../middleware/auth");

router.get("/", protect, getChatList);
router.get("/:otherUserId", protect, getConversation);

module.exports = router;
