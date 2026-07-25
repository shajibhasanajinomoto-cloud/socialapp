const express = require("express");
const router = express.Router();
const { updateAvatar, updateCover, getUserById, updateProfile, updateFamilyMembers } = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.put("/me", protect, updateProfile);
router.put("/me/family", protect, updateFamilyMembers);
router.put("/me/avatar", protect, upload.single("image"), updateAvatar);
router.put("/me/cover", protect, upload.single("image"), updateCover);
router.get("/:id", protect, getUserById);

module.exports = router;
