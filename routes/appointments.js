const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

// Generate slots for a specific date
function generateSlots(doctor, date) {
  const slots = [];
  const startHour = 4; // 4:00 AM
  const endHour = 21; // 9:00 PM

  // Clear previous day's appointments
  const today = new Date().toISOString().split("T")[0];
  if (date !== today) {
    doctor.availability = doctor.availability.filter((a) => a.date === today);
  }

  // Check existing booked appointments for the day
  const bookedAppointments = doctor.appointments.filter(
    (app) => app.date === date && app.status !== "cancelled"
  );

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute of [0, 30]) {
      const time = new Date();
      time.setHours(hour, minute, 0, 0);

      const timeString = time.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      // Check if this slot is already booked
      const isBooked = bookedAppointments.some(
        (app) => app.time === timeString
      );

      slots.push({
        time: timeString,
        available: !isBooked,
      });
    }
  }

  return slots;
}

// Get available and booked slots for a specific doctor and date
router.get("/slots", async (req, res) => {
  const { doctorId, date } = req.query;

  try {
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Generate slots for the day
    const slots = generateSlots(doctor, date);

    // Find booked appointments for the day
    const bookedAppointments = await Appointment.find({
      doctorId,
      date,
      status: { $ne: "cancelled" },
    });

    res.json({
      availableSlots: slots.filter((slot) => slot.available),
      bookedSlots: bookedAppointments,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Book an appointment
router.post("/", async (req, res) => {
  const { doctorId, patientId, date, time } = req.body;

  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Check if the slot is available
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date,
      time,
      status: { $ne: "cancelled" },
    });

    if (existingAppointment) {
      return res.status(400).json({ message: "Slot already booked" });
    }

    // Create the appointment
    const appointment = new Appointment({
      doctorId,
      patientId,
      date,
      time,
      status: "booked",
    });
    await appointment.save();

    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel an appointment
router.put("/cancel/:appointmentId", async (req, res) => {
  const { appointmentId } = req.params;

  try {
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    appointment.status = "cancelled";
    await appointment.save();

    res.status(200).json({
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
