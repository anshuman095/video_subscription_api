const port = process.env.PORT || 4005;
const express = require("express");
const app = express();
const dbConnect = require("./config/dbConnect");
const dotenv = require("dotenv").config();
const morgan = require("morgan");
const bodyParser = require("body-parser");
const { notFound } = require("./middlewares/errorHandler");
const authRouter = require("./routes/authRoute");
const videoRouter = require("./routes/videoRoute");
const commentRouter = require("./routes/commentRoute");

dbConnect();

app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  express.json({
    extended: true,
  })
);

app.use("/api/user", authRouter);
app.use("/api/video", videoRouter);
app.use("/api/comment", commentRouter);

app.use(notFound);
app.listen(port, () => {
  console.log(`Server is listening at ${port}`);
});
