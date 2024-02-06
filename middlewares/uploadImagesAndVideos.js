const multer = require("multer");
const path = require("path");

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, path.join(__dirname, "../public/Images"));
    } else {
      cb({ message: "This file is not an image file" }, false);
    }
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype === "video/mp4") {
      cb(null, path.join(__dirname, "../public/Videos"));
    } else {
      cb({ message: "This file is not in video format." }, false);
    }
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

module.exports = {
  imageUpload: multer({ storage: imageStorage }),
  videoUpload: multer({ storage: videoStorage }),
};
