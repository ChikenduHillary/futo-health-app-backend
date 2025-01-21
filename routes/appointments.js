const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

// Check availability or generate slots dynamically
async function getOrCreateAvailability(doctor, date) {
  // Check if the date already exists in the doctor's availability
  let availability = doctor.availability.find((a) => a.date === date);

  if (!availability) {
    // If not, generate slots for the given date
    const slots = generateSlots("09:00 AM", "04:00 PM");
    availability = { date, slots };
    doctor.availability.push(availability);
    await doctor.save();
  }

  return availability;
}

function generateSlots(start, end) {
  const slots = [];

  // Get the current date and set start and end times
  const currentDate = new Date();
  const startTime = new Date(currentDate);
  const endTime = new Date(currentDate);

  // Parse start and end times (e.g., "09:00 AM", "04:00 PM")
  const [startHours, startMinutes] = start.split(":").map(Number);
  const [endHours, endMinutes] = end.split(":").map(Number);

  // Set the hours and minutes for start and end times
  startTime.setHours(startHours, startMinutes, 0, 0);
  endTime.setHours(endHours, endMinutes, 0, 0);

  // Generate time slots between start and end times
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

router.get("/slots", async (req, res) => {
  const { doctorId, date } = req.query;

  try {
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Check if availability exists for the requested date
    let availability = doctor.availability.find((a) => a.date === date);

    // If no availability for the date, initialize it
    if (!availability) {
      const newSlots = initializeSlots();
      availability = { date, slots: newSlots };
      doctor.availability.push(availability);
      await doctor.save();
    }

    res.json(availability.slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Book an appointment
router.post("/", async (req, res) => {
  const { doctorId, patientId, date, time } = req.body;

  try {
    // Find the doctor
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Get or create availability for the requested date
    const availability = await getOrCreateAvailability(doctor, date);

    // Check if the requested time slot is available
    const slot = availability.slots.find((s) => s.time === time && s.available);
    if (!slot) {
      return res.status(400).json({ message: "Slot not available" });
    }

    // Mark the slot as unavailable
    slot.available = false;
    await doctor.save();

    // Create the appointment
    const appointment = new Appointment({ doctorId, patientId, date, time });
    await appointment.save();

    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
