const express = require("express");
const router = express.Router();
const wrapAsync = require("../middlewares/wrapAsync");
const { authorization } = require("../middlewares/authorization");
const messageController = require("../controllers/message");
const uploadfiles = require("../controllers/upload");
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });



router.post("/", authorization, wrapAsync(messageController.createMessage));
router.get("/:chatId", authorization, wrapAsync(messageController.allMessage));
router.get(
	"/clearChat/:chatId",
	authorization,
	wrapAsync(messageController.clearChat)
);


router.post("/upload", upload.array('images', 5), uploadfiles);			// this is for uploading images .
module.exports = router;
