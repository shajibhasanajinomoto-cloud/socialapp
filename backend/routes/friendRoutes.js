const express = require("express");
const router = express.Router();
const {
  sendRequest,
  acceptRequest,
  rejectRequest,
  unfriend,
  getFriends,
  getPendingRequests,
  getFriendshipStatus,
} = require("../controllers/friendController");
const { protect } = require("../middleware/auth");

router.get("/", protect, getFriends);
router.get("/requests", protect, getPendingRequests);
router.get("/status/:userId", protect, getFriendshipStatus);
router.post("/request/:userId", protect, sendRequest);
router.put("/accept/:requestId", protect, acceptRequest);
router.put("/reject/:requestId", protect, rejectRequest);
router.delete("/:userId", protect, unfriend);

module.exports = router;
