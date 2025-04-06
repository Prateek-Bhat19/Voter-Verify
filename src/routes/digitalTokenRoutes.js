const express = require("express");
const router = express.Router();
const { 
  generateDigitalToken, 
  downloadDigitalTokenPDF, 
  verifyDigitalToken 
} = require("../controllers/digitalTokenController");
const { authMiddleware } = require("../middleware/authMiddleware");

// Generate digital token for a voter
router.post("/generate", authMiddleware, generateDigitalToken);

// Download digital token as a PDF
router.get("/download", authMiddleware, downloadDigitalTokenPDF);

// Verify a digital token via POST
router.post("/verify", authMiddleware, verifyDigitalToken);

// Legacy endpoint for backward compatibility
router.get("/verify/:phoneNumber", authMiddleware, verifyDigitalToken);

module.exports = router;
