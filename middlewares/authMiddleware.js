const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../modals/userModal");

const authMiddleware = asyncHandler(async (req, res, next) => {
  let token;
  if (req?.headers?.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
    try {
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded?.id);
        req.user = user;
        next();
      }
    } catch (err) {
      throw new Error("Not authorized token expired, Please Login again");
    }
  } else {
    throw new Error("There is no token attached to header");
  }
});

const isCreator = asyncHandler(async (req, res, next) => {
  const { email } = req.user;
  const userCreator = await User.findOne({ email });
  if (userCreator.role !== "CREATOR") {
    throw new Error("You are not a creator");
  } else {
    next();
  }
});

module.exports = { authMiddleware, isCreator };

// const checkSubscription = async (req, res, next) => {
//   const { videoId } = req.params;

//   if (req.user) {
//     const video = await Video.findById(videoId);
//     if (video.isSubscription) {
//       const subscription = await Subscription.findOne({ userId: req.user._id, creatorId: video.creatorId });
//       if (!subscription) return res.sendStatus(403);
//     }
//   }

//   next();
// };
