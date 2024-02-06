const { default: mongoose } = require("mongoose");

const dbConnect = async () => {
  try {
    const conn = mongoose.connect(process.env.MONGODB_URL);
    console.log("Database successfully conncted");
  } catch (err) {
    console.log(err.message);
  }
};
module.exports = dbConnect;
