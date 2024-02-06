const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    title: { type: String },
    description: { type: String },
    price: { type: Number },
    videoUrl: [{ type: String, required: true }],
    isVideoType: {
      type: String,
      enum: ["PAID", "FREE"],
      default: "FREE",
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
      {
        type: String,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reports: [],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Video", videoSchema);
