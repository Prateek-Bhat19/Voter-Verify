const mongoose = require("mongoose");

const digitalTokenSchema = new mongoose.Schema(
  {
    voterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
      required: false,
      sparse: true,
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TimeSlot",
      required: true,
    },
    qrCode: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const DigitalToken = mongoose.model("DigitalToken", digitalTokenSchema);

module.exports = DigitalToken;
