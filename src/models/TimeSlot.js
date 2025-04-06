// models/TimeSlot.js
const mongoose = require("mongoose");

const timeSlotSchema = new mongoose.Schema({
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  startTime: { type: String, required: true }, // Format: HH:MM
  endTime: { type: String, required: true },
  maxCapacity: { type: Number, default: 75 },
  // Instead of an array of objects, store references to the User model:
  bookedVoters: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("TimeSlot", timeSlotSchema);
