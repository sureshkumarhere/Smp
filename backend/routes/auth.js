const express = require("express");
const router = express.Router();
const authControllers = require("../controllers/auth");
const wrapAsync = require("../middlewares/wrapAsync");
const { authorization } = require("../middlewares/authorization");

router.post("/signup", wrapAsync(authControllers.registerUser));
router.post("/signin", wrapAsync(authControllers.loginUser));
router.post("/reset-password", authorization, wrapAsync(authControllers.resetPassword));

module.exports = router;
