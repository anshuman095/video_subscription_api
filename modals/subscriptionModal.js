const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  subscription: {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Videos",
      required: true,
    },
    subscriptionFee: { type: Boolean },
  },
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
