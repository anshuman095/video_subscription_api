const mongoose = require("mongoose");

var commentSchema = new mongoose.Schema(
  {
    comment: {
      type: String,
    },
    commentedOn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Comment", commentSchema);
