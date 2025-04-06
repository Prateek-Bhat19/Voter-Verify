const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const dotenv = require("dotenv");
dotenv.config();

const authMiddleware = async (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1]; // Extract token
    if (!token) {
        return res.status(401).json({ message: "Access Denied. No Token Provided." });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Get userId from either id or userId field in the token
        const userId = decoded.id || decoded.userId;
        req.user = await User.findById(userId).select("-password");

        if (!req.user) {
            return res.status(401).json({ message: "User not found. Authentication failed." });
        }

        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or Expired Token" });
    }
};

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1]; // Extract token
    if (!token) {
        return res.status(401).json({ message: "Access Denied. No Token Provided." });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Get userId from either id or userId field in the token
        const userId = decoded.id || decoded.userId;
        req.user = await User.findById(userId).select("-password");

        if (!req.user) {
            return res.status(401).json({ message: "User not found. Authentication failed." });
        }

        // Check if user is admin
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: "Access Denied. Admin privileges required." });
        }

        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or Expired Token" });
    }
};

module.exports = { authMiddleware, authenticateAdmin };
