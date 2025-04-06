const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/send-otp", authController.sendOTP);
router.post("/verify-otp", authController.verifyOTP);
router.post("/verify-otp-and-get-uid", authController.verifyOTPAndGetUID);
router.post('/login', authController.login);
router.post("/refresh-token", authController.refreshToken);


module.exports = router;