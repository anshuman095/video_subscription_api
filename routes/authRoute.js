const express = require("express");
const router = express.Router();
const {
  createUser,
  verifyOtp,
  loginUser,
  loginCreator,
  handleRefreshToken,
  logOut,
  getAllUser,
  getUserById,
  deleteUser,
  updateUser,
  updatePassword,
  forgotPasswordToken,
  resetPassword,
  getVideosOfAUser,
  getAllVideos,
  blockUser,
  unBlockUser,
  addToFavourites,
  removeFromFavourites,
  reportOnVideo,
} = require("../controllers/userController");
const { authMiddleware } = require("../middlewares/authMiddleware");
upload = require("../middlewares/uploadImagesAndVideos");

router.post("/register", createUser);
router.put("/verifyOtp", verifyOtp);
router.post("/login", loginUser);
router.post("/loginCreator", loginCreator);
router.get("/handleRefreshToken", handleRefreshToken);
router.get("/logout", logOut);
router.put("/update/edit-user", authMiddleware, updateUser);
router.get("/allUser", getAllUser);
router.get("/getVideosOfAUser", authMiddleware, getVideosOfAUser);
router.get("/getAllVideos", authMiddleware, getAllVideos);
router.get("/:id", authMiddleware, getUserById);
router.delete("/:id", deleteUser);
router.put("/password", authMiddleware, updatePassword);
router.post("/forgot-password-token", forgotPasswordToken);
router.post("/reset-password/:token", resetPassword);
router.put("/blockUser/:id", authMiddleware, blockUser);
router.put("/unBlockUser/:id", authMiddleware, unBlockUser);
router.put("/addToFavourites/:id", authMiddleware, addToFavourites);
router.put("/removeFromFavourites/:id", authMiddleware, removeFromFavourites);
router.post("/report/:id", authMiddleware, reportOnVideo);

module.exports = router;
