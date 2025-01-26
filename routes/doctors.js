const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");

// Generate slots with updated requirements
function generateSlots() {
  const slots = [];
  const startHour = 4; // 4:00 AM
  const endHour = 21; // 9:00 PM

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute of [0, 30]) {
      const time = new Date();
      time.setHours(hour, minute, 0, 0);

      const timeString = time.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      slots.push({
        time: timeString,
        available: true,
      });
    }
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

// Add a new doctor
router.post("/", async (req, res) => {
  const { name, specialization, email, phoneNumber, gender, dateOfBirth } =
    req.body;

  try {
    // Validate required fields
    if (
      !name ||
      !specialization ||
      !email ||
      !phoneNumber ||
      !gender ||
      !dateOfBirth
    ) {
      return res.status(400).json({
        message:
          "All fields are required: name, specialization, email, phoneNumber, gender, and dateOfBirth",
      });
    }

    // Validate gender
    if (!["male", "female"].includes(gender)) {
      return res
        .status(400)
        .json({ message: "Invalid gender. Must be 'male' or 'female'." });
    }

    // Validate date of birth
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      return res.status(400).json({ message: "Invalid date of birth format." });
    }

    // Generate slots for today and tomorrow
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000)
      .toISOString()
      .split("T")[0];

    const availability = [
      { date: today, slots: generateSlots() },
      { date: tomorrow, slots: generateSlots() },
    ];

    // Create the doctor
    const doctor = new Doctor({
      name,
      specialization,
      email,
      phoneNumber,
      gender,
      dateOfBirth: dob,
      availability,
      appointments: [],
    });

    await doctor.save();

    res.status(201).json(doctor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update doctor availability
router.put("/:id/availability", async (req, res) => {
  const { id } = req.params;
  const { date } = req.body;

  try {
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Remove old availability for the specific date
    doctor.availability = doctor.availability.filter((a) => a.date !== date);

    // Add new availability for the date
    doctor.availability.push({
      date,
      slots: generateSlots(),
    });

    await doctor.save();

    res.json(doctor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
