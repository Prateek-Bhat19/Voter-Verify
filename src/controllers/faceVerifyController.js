const { verifyFace } = require("../services/googleVision");
const fs = require("fs");
const path = require("path");
const User = require("../models/userModel");
const axios = require("axios");

const faceVerification = async(req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ success: false, message: "No image received" });

    // Store the face embedding in the user's document
    try {
      const userEmail = req.user.email;
      
      // Store the face image in the user document
      const user = await User.findOneAndUpdate(
        { email: userEmail }, 
        { 
          faceEmbedding: image, // Store the raw image data as the embedding
          faceVerifiedAt: new Date() 
        },
        { new: true }
      );

      if (!user) {
        console.error("User not found:", userEmail);
        return res.status(404).json({ success: false, message: "User not found" });
      }

      return res.status(200).json({ 
        success: true, 
        message: "Face registered successfully!",
        userId: user._id
      });
    } catch (error) {
      console.error("Error registering face:", error);
      return res.status(500).json({ success: false, message: "Failed to register face" });
    }
  } catch (error) {
    console.error("Face Verification Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = { faceVerification };
