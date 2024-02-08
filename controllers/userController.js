const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const speakeasy = require("speakeasy");
const validateMongoDbId = require("../utils/validateMongoDbId");
const User = require("../modals/userModal");
const Video = require("../modals/videoModel");
const Report = require("../modals/reportModel");
const { generateToken } = require("../config/jwtToken");
const { generateRefreshToken } = require("../config/refreshToken");
const sendEmailController = require("../utils/emailSend");
const { STRIPE_SECRET_KEY } = process.env;
const stripe = require("stripe")(STRIPE_SECRET_KEY);

const createUser = asyncHandler(async (req, res) => {
  try {
    const { email, name } = req.body;
    const findUser = await User.findOne({ email: email });
    if (!findUser) {
      const secret = speakeasy.generateSecret({ length: 20 });
      const otp = speakeasy.totp({
        secret: secret.base32,
        encoding: "base32",
      });
      const data = {
        to: email,
        text: `Hey User this is otp ${otp} valid for 10 min`,
        subject: "Otp Verification",
        otp: otp,
      };
      sendEmailController(data);
      const customer = await stripe.customers.create({
        name: name,
        email: email,
      });
      const newUser = await User.create({
        ...req.body,
        otp: otp,
        stripe_customer_id: customer.id,
      });
      res.json(newUser);
    } else {
      throw new Error("User alrady exists");
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { otp, email } = req.body;
  try {
    const user = await User.findOne({ otp });
    if (!user) {
      res.status(400).json({ message: "Otp is not valid" });
    }
    await User.findOneAndUpdate({ otp }, { isValidOtp: true }, { new: true });
    res.status(200).json({
      message: "Otp Verfication Successfully",
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password, phone_number } = req.body;
  const findUser = await User.findOne({ email });
  const findPhone = await User.findOne({ phone_number });
  if (
    (findUser && (await findUser.isPasswordMatched(password))) ||
    (findPhone && (await findUser.isPasswordMatched(password)))
  ) {
    const refreshToken = generateRefreshToken(findUser._id);
    const user = await User.findByIdAndUpdate(
      findUser._id,
      {
        refreshToken: refreshToken,
      },
      { new: true }
    );
    res.cookie("refreshTokeen", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });
    res.json({
      result: "Logged in successfully",
      data: user,
      token: generateToken(findUser?._id),
    });
  } else {
    res.status(400).json({
      message: "Invalid Credentials",
    });
  }
});

const loginCreator = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const findCreator = await User.findOne({ email });
  if (!findCreator) {
    res.status(400).json({
      message: "User Not Found",
    });
  }
  if (findCreator.role !== "CREATOR") {
    res.status(400).json({
      message: "Not Authorized",
    });
  }
  if (findCreator && (await findCreator.isPasswordMatched(password))) {
    // delete findAdmin.password;
    const refreshToken = generateRefreshToken(findCreator._id);
    const user = await User.findByIdAndUpdate(
      findCreator._id,
      {
        refreshToken: refreshToken,
      },
      { new: true }
    );
    res.cookie("refreshTokeen", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });
    res.json({
      result: "Logged in successfully",
      data: user,
      token: generateToken(findCreator?._id),
    });
  } else {
    res.status(400).json({
      message: "Invalid Credentials",
    });
  }
});

const handleRefreshToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) {
    throw new Error("No refresh token in cookies");
  }
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if (!user) {
    throw new Error("No refresh token present in db or not matched");
  }
  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err || user.id !== decoded.id) {
      throw new Error("There is something wrong with refresh token");
    }
    const accessToken = generateToken(user?._id);
    res.json({ accessToken });
  });
});

const logOut = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) {
    throw new Error("No refresh token in cookies");
  }
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if (!user) {
    res.clearCookie("refreshToken", { httpOnly: true, secure: true });
    return res.status(204);
  }
  await User.findOneAndUpdate(
    { refreshToken },
    { refreshToken: "" },
    { new: true }
  );
  res.clearCookie("refreshToken", { httpOnly: true, secure: true });
  res.status(204);
});

const updateUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);

  const user = await User.findById(_id);
  if (!user) {
    return res.json({
      success: false,
      message: "User not found",
    });
  }
  Object.assign(user, req.body);
  const updatedUser = await user.save();

  res.json(updatedUser);
});

const getAllUser = asyncHandler(async (req, res) => {
  try {
    const getAllUsers = await User.find();
    res.json(getAllUsers);
  } catch (err) {
    throw new Error(err);
  }
});

const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const getUser = await User.findById(id);
    res.json(getUser);
  } catch (err) {
    throw new Error(err);
  }
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const deletedUser = await User.findByIdAndDelete(id);
    res.json(deletedUser);
  } catch (err) {
    throw new Error(err);
  }
});

const updatePassword = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { current_password, new_password, confirm_new_password } = req.body;
  const salt = bcrypt.genSalt(10);
  const hashedPassword = bcrypt.hash(current_password, salt);
  const user = await User.findById(_id);
  if (user) {
    const passwordMatch = await user.isPasswordMatched(hashedPassword);
    if (passwordMatch) {
      if (new_password === confirm_new_password) {
        const salt = bcrypt.genSalt(10);
        let new_generated_password = await bcrypt.hash(new_password, salt);
        await User.findByIdAndUpdate(
          user._id,
          { password: new_generated_password },
          { new: true }
        );
        res.status(200).json({
          success: true,
          message: "Password update successfully",
        });
      } else {
        throw new Error("New Password And Current Password does not match");
      }
    } else {
      throw new Error("Current password is not correct");
    }
  } else {
    throw new Error("User does not exist");
  }
  if (password) {
    user.password = password;
    const updatedPassword = await user.save();
    res.json(updatedPassword);
  } else {
    res.json(user);
  }
});

const forgotPasswordToken = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("User does not exist");
  }
  try {
    const token = await user.createPasswordResetToken(email);
    await User.findOneAndUpdate(
      { email },
      { passwordResetToken: token },
      { new: true }
    );
    const resetURL = `Hi. Please follow this link to reset Your Password. This link will be valid for 10 minutes. <a 
    href='http://localhost:4000/api/user/reset-password/${token}/'>Click here</a>`;
    const data = {
      to: email,
      text: "Hey User",
      subject: "Forgot Password Link",
      html: resetURL,
    };
    sendEmailController(data);
    res.status(200).json({ message: "Password reset mail sent" });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword, confirmPassword } = req.body;
  const user = await User.findOne({ passwordResetToken: token });
  if (user) {
    const { email } = await user.verifyPasswordResetToken(token);
    const userExist = await User.findOne({ email });
    if (userExist) {
      if (newPassword === confirmPassword) {
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await User.findOneAndUpdate(
          { email },
          {
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetExpires: null,
          },
          { new: true }
        );
        res.status(200).json({
          success: true,
          message: "Password successfully updated",
        });
      } else {
        res.status(400).json({
          success: false,
          message: "New password and confirm password don't match",
        });
      }
    }
  } else {
    res.status(404).json({
      message: "Invalid or expired token",
    });
  }
});

const getSubscriptionOfVideo = asyncHandler(async (req, res) => {
  // const
});

const getVideosOfAUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const video = await User.findById({ _id })
      .select("video -_id")
      .populate("video");
    res.status(200).json(video);
    if (!video) {
      res.status(400).json({ message: "User does not exist" });
    }
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
});

const getAllVideos = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const user = await User.findById(_id);
    if (!user) {
      throw new Error("User does not exist");
    }
    const { blockedUsers, blockedBy } = await User.findById(_id);

    const videos = await Video.find({
      createdBy: {
        $nin: [...blockedUsers, ...blockedBy],
        // $ne: _id, // Exclude videos created by the requesting user
      },
    });
    res.status(200).json(videos);
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
});

const blockUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const id = req.params.id;
  validateMongoDbId(_id);
  validateMongoDbId(id);
  try {
    const user = await User.findById(_id);
    if (!user) {
      throw new Error("Something went wrong");
    }
    const userToBlock = await User.findById(id);
    if (!userToBlock) {
      throw new Error("User does not exist");
    }
    const isUserBlockedAlready = user.blockedUsers.includes(id);

    const isUserBlockedBy = userToBlock.blockedBy.includes(_id);

    if (isUserBlockedAlready) {
      user.blockedUsers = user.blockedUsers.filter(
        (blockedUserId) => blockedUserId.toString() !== id
      );
    }

    if (isUserBlockedBy) {
      userToBlock.blockedBy = userToBlock.blockedBy.filter((blockedById) => {
        blockedById.toString() !== _id;
      });
    }

    user.blockedUsers.push(id);
    userToBlock.blockedBy.push(_id);

    await user.save();
    await userToBlock.save();
    res.status(200).json({
      message: "User Blcoked Successfully",
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
});

const unBlockUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const id = req.params.id;
  try {
    const userExist = await User.findById(_id);
    if (!userExist) {
      throw new Error("Something went wrong");
    }
    const userToUnBlock = await User.findById(id);
    if (!userToUnBlock) {
      throw new Error("User does not exist");
    }
    await User.findByIdAndUpdate(
      _id,
      { $pull: { blockedUsers: id } },
      { new: true }
    );
    await User.findByIdAndUpdate(
      id,
      { $pull: { blockedBy: _id } },
      { new: true }
    );
    res.status(200).json({
      message: "User Unblocked Successfully",
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
});

const addToFavourites = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const id = req.params.id;
  validateMongoDbId(_id);
  validateMongoDbId(id);
  try {
    const user = await User.findByIdAndUpdate(_id);
    if (!user) {
      throw new Error("Something went wrong");
    }
    const videoExist = await Video.findById(id);
    if (!videoExist) {
      throw new Error("Video does not exist");
    }
    const alreadyExist = user.favourites.includes(id);
    if (alreadyExist) {
      user.favourites = user.favourites.filter((videoId) => {
        videoId.toString() !== id;
      });
    }
    user.favourites.push(id);
    await user.save();
    res.status(200).json(user);
  } catch (err) {
    res.status(200).json({
      message: err.message,
    });
  }
});

const removeFromFavourites = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const id = req.params.id;
  validateMongoDbId(_id);
  validateMongoDbId(id);
  try {
    const videoExist = await Video.findById(id);
    if (!videoExist) {
      throw new Error("Video does not exist");
    }
    const user = await User.findByIdAndUpdate(
      _id,
      { $pull: { favourites: id } },
      { new: true }
    );
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
});

const reportOnVideo = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { id } = req.params;
  const { report_reason } = req.body;
  validateMongoDbId(_id);
  validateMongoDbId(id);
  try {
    const user = await User.findById(_id);
    if (!user) {
      throw new Error("Something went wrong");
    }
    const video = await Video.findById(id);
    if (!video) {
      throw new Error("Video not found");
    }
    await Report.create({
      report_reason,
      reportedBy: _id,
      reported_on_video: id,
    });
    await Video.findByIdAndUpdate(
      id,
      {
        reports: [...video.reports, report_reason],
      },
      { new: true }
    );
    res.status(200).json({
      message: "Reported Successfully",
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
});

module.exports = {
  createUser,
  verifyOtp,
  loginUser,
  loginCreator,
  handleRefreshToken,
  logOut,
  updateUser,
  getAllUser,
  getUserById,
  deleteUser,
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
};
