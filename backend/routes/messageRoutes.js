const express = require("express");
const router = express.Router();
const { getConversation, getChatList, uploadMedia } = require("../controllers/messageController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.get("/", protect, getChatList);
router.get("/:otherUserId", protect, getConversation);
router.post("/upload-media", protect, upload.single("file"), uploadMedia);

module.exports = router;
