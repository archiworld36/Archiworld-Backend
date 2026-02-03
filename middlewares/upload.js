// middlewares/upload.js
const multer = require("multer");
module.exports.upload = multer({
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});
