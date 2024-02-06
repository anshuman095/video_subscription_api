const asyncHandler = require("express-async-handler");
const fs = require("fs");
const User = require("../modals/userModal");
const Video = require("../modals/videoModel");
const validateMongoDbId = require("../utils/validateMongoDbId");
const { uploads } = require("../utils/cloudinary");

const createVideo = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  const file = req.files;
  const { title, description, price, isVideoType } = req.body;
  try {
    var videoUrlList = [];

    for (var i = 0; i < file.length; i++) {
      var locaFilePath = req.files[i].path;
      var result = await uploads(locaFilePath);
      videoUrlList.push(result.url);
      fs.unlinkSync(locaFilePath);
    }
    const video = await Video.create({
      title: title,
      description: description,
      price,
      videoUrl: videoUrlList,
      isVideoType,
      createdBy: _id,
    });
    const user = await User.findByIdAndUpdate(
      _id,
      { $push: { video: video._id } },
      { new: true }
    );

    return res.status(200).json({ video, user });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
});

module.exports = { createVideo };
