// models/userModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    adharNumber: { type: String },
    phoneNumber: {
        type: String,
        required: true,
        unique: true
    },
    voterId: {
        type: String,
        required: true,
        unique: true
    },
    phoneNumberVerified: { type: Boolean, default: false },
    faceEmbedding: { type: Array, required: false },
    digitalToken: {
        type: String,
        unique: true,
        sparse: true
    },
    // Change timeSlot from a string to a reference to TimeSlot (single booking)
    timeSlot: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "TimeSlot", 
      default: null 
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    faceVerifiedAt: {
      type: Date,
      default: null
    },
    tokenVerifiedAt: {
      type: Date,
      default: null
    },
    // Face verification fields
    faceImage: {
        type: String  // Base64 encoded image
    },
    faceImageUrl: {
        type: String  // Cloudinary URL for the face image
    },
    hasFaceRegistered: {
        type: Boolean,
        default: false
    },
    faceRegisteredAt: {
        type: Date
    },
    lastFaceVerification: {
        type: Date
    },
    faceVerificationAttempts: {
        type: Number,
        default: 0
    },
    faceVerificationLocked: {
        type: Boolean,
        default: false
    },
    faceVerificationLockedUntil: {
        type: Date
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to check if face verification is locked
userSchema.methods.isFaceVerificationLocked = function() {
    if (!this.faceVerificationLocked) return false;
    if (this.faceVerificationLockedUntil && this.faceVerificationLockedUntil > new Date()) {
        return true;
    }
    // Reset lock if time has expired
    this.faceVerificationLocked = false;
    this.faceVerificationLockedUntil = null;
    return false;
};

// Method to increment face verification attempts
userSchema.methods.incrementFaceVerificationAttempts = async function() {
    this.faceVerificationAttempts += 1;
    
    // Lock face verification after 3 failed attempts
    if (this.faceVerificationAttempts >= 3) {
        this.faceVerificationLocked = true;
        this.faceVerificationLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
    }
    
    await this.save();
};

// Method to reset face verification attempts
userSchema.methods.resetFaceVerificationAttempts = async function() {
    this.faceVerificationAttempts = 0;
    this.faceVerificationLocked = false;
    this.faceVerificationLockedUntil = null;
    await this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
