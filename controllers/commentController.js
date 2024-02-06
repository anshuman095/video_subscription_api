const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");
const Comment = require("../modals/commetModal");
const Video = require("../modals/videoModel");

const commentOnVideo = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { videoId } = req.params;
  const { comment } = req.body;
  validateMongoDbId(_id);
  validateMongoDbId(videoId);
  try {
    const comments = await Comment.create({
      comment: comment,
      commentedOn: videoId,
    });
    await Video.findByIdAndUpdate(videoId, {
      $push: { comments: comments._id },
    });
    res.status(201).json({
      comment: comments,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
});

const getCommentOnAVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  validateMongoDbId(videoId);
  try {
    const commentOnVideo = await Comment.find({
      commentedOn: videoId,
    }).select("comment -_id");
    if (!commentOnVideo) {
      res.status(400).json({
        message: "Comment not found",
      });
    } else {
      res.status(200).json({
        comments: commentOnVideo,
      });
    }
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
});

const getAllComments = asyncHandler(async (req, res) => {
  try {
    const allComments = await Comment.find().select("-_id comment");
    res.status(200).json({
      comments: allComments,
    });
  } catch (err) {
    res.status(400).json({
      message: "Comment not found",
    });
  }
});

module.exports = { commentOnVideo, getCommentOnAVideoById, getAllComments };
