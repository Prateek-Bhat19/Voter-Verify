const TimeSlot = require("../models/TimeSlot");
const moment = require("moment");
const User = require("../models/userModel"); // Ensure User is imported


const mongoose = require("mongoose");


// Create a new time slot (Admin Only)
exports.createTimeSlot = async (req, res) => {
  try {
    const { date, startTime, endTime, maxCapacity } = req.body;

    // Validate required fields
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ error: "Date, startTime, and endTime are required." });
    }

    // Create new time slot with a default maxCapacity of 75 if not provided
    const newSlot = new TimeSlot({
      date,
      startTime,
      endTime,
      maxCapacity: maxCapacity || 75,
      bookedVoters: [] // Start with an empty array
    });

    await newSlot.save();
    res.status(201).json({ message: "Time slot created successfully", slot: newSlot });
  } catch (error) {
    console.error("Error in createTimeSlot:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get available time slots (optionally filtered by date)
exports.getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;
    
    // If no date provided, return all slots
    let query = {};
    if (date) {
      // Format the date to match the stored format (YYYY-MM-DD)
      const formattedDate = moment(date).format('YYYY-MM-DD');
      query.date = formattedDate;
    }
    
    // Find all slots matching the query
    const slots = await TimeSlot.find(query);
    
    // If no slots found, return empty array
    if (!slots || slots.length === 0) {
      return res.json([]);
    }
    
    res.json(slots);
  } catch (error) {
    console.error("Error in getAvailableSlots:", error);
    res.status(500).json({ error: error.message });
  }
};


// Book a time slot
// controllers/timeSlotController.js
exports.bookTimeSlot = async (req, res) => {
  try {
    // Rely on authMiddleware setting req.user
    const userId = req.user._id; 
    const { slotId } = req.body; // We only need slotId

    if (!slotId) {
      return res.status(400).json({ error: "slotId is required." });
    }

    // Fetch the user to check if a booking already exists
    const user = await User.findById(userId);
    if (user.timeSlot) {
      return res.status(400).json({ error: "User has already booked a time slot" });
    }

    const slot = await TimeSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ error: "Time slot not found" });
    }

    if (slot.bookedVoters.length >= slot.maxCapacity) {
      return res.status(400).json({ error: "Slot is already full" });
    }

    // Check if user has already booked in the slot (shouldn't happen if user.timeSlot is null)
    if (slot.bookedVoters.some(voterObjId => voterObjId.equals(userId))) {
      return res.status(400).json({ error: "Voter has already booked this time slot" });
    }

    // Add the user's ObjectId to the slot's bookedVoters
    slot.bookedVoters.push(userId);
    await slot.save();

    // Update the user's document with the booked slot id
    user.timeSlot = slot._id;
    await user.save();

    res.status(200).json({ message: "Time slot booked successfully", slot });
  } catch (error) {
    console.error("Error booking time slot:", error);
    res.status(500).json({ error: error.message });
  }
};






exports.getQueueStatus = async (req, res) => {
  try {
    const { slotId } = req.params;
    const slot = await TimeSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ error: "Time slot not found" });
    }

    // Ensure bookedVoters is an array
    const bookedVoters = slot.bookedVoters || [];

    const startDateTime = moment(`${slot.date} ${slot.startTime}`, "YYYY-MM-DD h:mm A");
    const now = moment();

    let elapsedMinutes = now.diff(startDateTime, "minutes");
    if (elapsedMinutes < 0) elapsedMinutes = 0;

    const avgServiceTimePerVoter = 5;
    const votersServed = Math.floor(elapsedMinutes / avgServiceTimePerVoter);
    const currentToken = Math.min(votersServed, bookedVoters.length);
    const currentVoter = bookedVoters[currentToken] || null;
    const nextVoterPosition = currentToken + 1;
    const estimatedWait = nextVoterPosition * avgServiceTimePerVoter;

    res.status(200).json({
      slotId: slot._id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      bookedCount: bookedVoters.length,
      currentToken,
      currentVoter,
      nextVoter: bookedVoters[nextVoterPosition] || null,
      estimatedWait: `${estimatedWait} minutes`
    });

  } catch (error) {
    console.error("Error in getQueueStatus:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getBookedSlot = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate("timeSlot");
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // If the user has no booked slot, return an empty array
    if (!user.timeSlot) {
      return res.status(200).json([]);
    }
    
    // Format the date and time to ensure proper display
    const slot = user.timeSlot.toObject();
    if (slot.date) {
      // Format date as YYYY-MM-DD
      slot.date = moment(slot.date).format('YYYY-MM-DD');
    }
    if (slot.startTime) {
      // Format time as HH:mm A
      slot.startTime = moment(slot.startTime, 'HH:mm').format('hh:mm A');
    }
    if (slot.endTime) {
      // Format time as HH:mm A
      slot.endTime = moment(slot.endTime, 'HH:mm').format('hh:mm A');
    }
    
    // Return an array with a single slot object
    res.status(200).json([slot]);
  } catch (error) {
    console.error("Error fetching booked slot:", error);
    res.status(500).json({ error: error.message });
  }
};
