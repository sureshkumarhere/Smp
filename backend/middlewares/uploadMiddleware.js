const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|mp4|mov|avi|webm/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext.substring(1))) cb(null, true);
  else cb(new Error("Only images and videos are allowed!"));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB limit

module.exports = upload;
