const express = require("express");
const { authMiddleware, isCreator } = require("../middlewares/authMiddleware");
const { createVideo } = require("../controllers/videoController");
const router = express.Router();

router.post(
  "/createVideo",
  authMiddleware,
  isCreator,
  upload.videoUpload.any(),
  createVideo
);

module.exports = router;
