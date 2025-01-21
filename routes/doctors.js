const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");

function initializeSlots(date) {
  // Ensure the date is in the correct format (e.g., "YYYY-MM-DD")
  const parsedDate = new Date(date);

  if (isNaN(parsedDate)) {
    throw new Error("Invalid date format. Expected format: YYYY-MM-DD");
  }

  // Set the time to 09:00:00
  const startTime = new Date(parsedDate.setHours(9, 0, 0, 0)); // 9:00 AM
  const endTime = new Date(parsedDate.setHours(16, 0, 0, 0)); // 4:00 PM

  const slots = [];

  while (startTime < endTime) {
    const slotTime = startTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    slots.push({ time: slotTime, available: true });
    startTime.setMinutes(startTime.getMinutes() + 10); // Add 10 minutes for appointment
    startTime.setMinutes(startTime.getMinutes() + 5); // Add 5 minutes for rest
  }

  return slots;
}

// Get all doctors
router.get("/", async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new doctor with initialized slots
router.post("/", async (req, res) => {
  const { name, specialization, email } = req.body; // `dates` is now optional

  try {
    if (!name || !specialization || !email) {
      return res.status(400).json({
        message: "Name, specialization, and email are required.",
      });
    }

    // Initialize availability
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const today = now.toISOString().split("T")[0]; // Current date
    const tomorrow = new Date(now.getTime() + 86400000)
      .toISOString()
      .split("T")[0]; // Next day

    // Generate slots for today starting from the current time
    const startToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      Math.max(9, currentHour), // Start at 9 AM or current hour, whichever is later
      currentMinute > 0 ? 15 * Math.ceil(currentMinute / 15) : 0 // Round to next 15-minute mark
    );

    const todaySlots =
      currentHour < 16 ? generateSlots(startToday, "04:00 PM") : []; // Slots only if before 4 PM

    // Generate slots for tomorrow (full availability)
    const tomorrowSlots = generateSlots("09:00 AM", "04:00 PM");

    // Prepare availability
    const availability = [
      { date: today, slots: todaySlots },
      { date: tomorrow, slots: tomorrowSlots },
    ];

    const doctor = new Doctor({ name, specialization, availability, email });
    await doctor.save();

    res.status(201).json(doctor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }

  // Utility function to generate time slots
  function generateSlots(start, end) {
    const slots = [];
    const startTime =
      typeof start === "string" ? new Date(`1970-01-01T${start}`) : start;
    const endTime = new Date(`1970-01-01T${end}`);

    let currentTime = new Date(startTime);
    while (currentTime < endTime) {
      const timeString = currentTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      slots.push({ time: timeString, available: true });

      // Add 15 minutes (10 mins appointment + 5 mins rest)
      currentTime.setMinutes(currentTime.getMinutes() + 15);
    }

    return slots;
  }
});

module.exports = router;
