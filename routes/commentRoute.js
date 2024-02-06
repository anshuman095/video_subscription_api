const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const {
  commentOnVideo,
  getCommentOnAVideoById,
  getAllComments,
} = require("../controllers/commentController");

router.post("/create/:videoId", authMiddleware, commentOnVideo);
router.get("/getCommentOnVideoById/:videoId", getCommentOnAVideoById);
router.get("/getAllComments", getAllComments);

module.exports = router;
