const express = require("express");
const router = express.Router();
const TimeSlot = require("../models/TimeSlot");
const { 
  createTimeSlot, 
  getAvailableSlots, 
  bookTimeSlot, 
  getQueueStatus, 
  getBookedSlot
} = require("../controllers/timeSlotController");

const { authMiddleware } = require("../middleware/authMiddleware");
const { authenticateAdmin } = require("../middleware/authMiddleware");

// Get all time slots (Admin only)
router.get("/", authenticateAdmin, async (req, res) => {
  try {
    const slots = await TimeSlot.find().sort({ date: 1, startTime: 1 });
    res.json(slots);
  } catch (error) {
    console.error("Error fetching time slots:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new time slot (Admin only)
router.post("/", authenticateAdmin, async (req, res) => {
  try {
    const { date, startTime, endTime, maxCapacity } = req.body;

    // Validate required fields
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ error: "Date, startTime, and endTime are required." });
    }

    // Create new time slot
    const newSlot = new TimeSlot({
      date,
      startTime,
      endTime,
      maxCapacity: maxCapacity || 75,
      bookedVoters: []
    });

    await newSlot.save();
    res.status(201).json({ message: "Time slot created successfully", slot: newSlot });
  } catch (error) {
    console.error("Error creating time slot:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a time slot (Admin only)
router.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const slot = await TimeSlot.findByIdAndDelete(req.params.id);
    if (!slot) {
      return res.status(404).json({ error: "Time slot not found" });
    }
    res.json({ message: "Time slot deleted successfully" });
  } catch (error) {
    console.error("Error deleting time slot:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get available time slots
router.get("/available", getAvailableSlots);

// Book a time slot (Protected Route)
router.post("/book", authMiddleware, bookTimeSlot);

// Get queue status for a slot
router.get("/queue/:slotId", authMiddleware, getQueueStatus);

// Get booked slots for the authenticated voter
router.get("/booked", authMiddleware, getBookedSlot);

module.exports = router;
