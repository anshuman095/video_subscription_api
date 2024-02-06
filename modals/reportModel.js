const mongoose = require("mongoose");

var reportSchema = new mongoose.Schema({
  report_reason: {
    type: String,
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  reported_on_video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Video",
  },
});

module.exports = mongoose.model("Report", reportSchema);
