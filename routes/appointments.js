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
  const { doctorId, patientId, date } = req.query;

  try {
    // Validate input: Ensure either doctorId or patientId is provided
    if ((!doctorId && !patientId) || (doctorId && patientId)) {
      return res.status(400).json({
        message: "Please provide either doctorId or patientId, but not both.",
      });
    }

    // Validate ObjectId for doctorId or patientId
    const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id); // Regex for MongoDB ObjectId

    if (doctorId && !isValidObjectId(doctorId)) {
      return res.status(400).json({ message: "Invalid doctorId format." });
    }

    if (patientId && !isValidObjectId(patientId)) {
      return res.status(400).json({ message: "Invalid patientId format." });
    }

    if (!date) {
      return res.status(400).json({ message: "Date parameter is required." });
    }

    if (doctorId) {
      // Fetch doctor and their slots
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found." });
      }

      const slots = generateSlots(doctor, date);
      const bookedAppointments = await Appointment.find({
        doctorId,
        date,
        status: { $ne: "cancelled" },
      });

      return res.json({
        type: "doctor",
        availableSlots: slots.filter((slot) => slot.available),
        bookedSlots: bookedAppointments,
      });
    }

    if (patientId) {
      // Fetch appointments for the patient
      const patientAppointments = await Appointment.find({
        patientId,
        date,
      });

      console.log(patientAppointments);

      if (!patientAppointments.length) {
        return res.status(404).json({
          message:
            "No appointments found for this patient on the selected date.",
        });
      }

      return res.json({
        type: "patient",
        appointments: patientAppointments,
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Book an appointment
router.post("/", async (req, res) => {
  const { doctorId, patientId, date, time } = req.body;

  try {
    const doctor = await Doctor.findById(doctorId);
    const patient = await Patient.findById(patientId);

    if (!doctor || !patient) {
      return res.status(404).json({ message: "Doctor or Patient not found" });
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

    // Create notifications for both doctor and patient
    const doctorNotification = new Notification({
      userId: doctorId,
      message: `New appointment booked with ${patient.name} on ${date} at ${time}.`,
    });

    const patientNotification = new Notification({
      userId: patientId,
      message: `Your appointment with Dr. ${doctor.name} is booked on ${date} at ${time}.`,
    });

    await doctorNotification.save();
    await patientNotification.save();

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

router.get("/all", async (req, res) => {
  const { doctorId, patientId } = req.query;

  try {
    // Validate that at least one ID is provided
    if (!doctorId && !patientId) {
      return res
        .status(400)
        .json({ message: "Provide either doctorId or patientId." });
    }

    // Validate ObjectIds
    const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
    if (doctorId && !isValidObjectId(doctorId)) {
      return res.status(400).json({ message: "Invalid doctorId." });
    }
    if (patientId && !isValidObjectId(patientId)) {
      return res.status(400).json({ message: "Invalid patientId." });
    }

    // Build the query object
    const query = {};
    if (doctorId) query.doctorId = doctorId;
    if (patientId) query.patientId = patientId;

    // Find all appointments that match the query
    const appointments = await Appointment.find(query)
      .populate("doctorId", "name specialty") // Populate doctor details
      .populate("patientId", "name email") // Populate patient details
      .sort({ date: 1, time: 1 }); // Sort by date and time in ascending order

    if (!appointments.length) {
      return res.status(404).json({ message: "No appointments found." });
    }

    // Separate appointments into past, present, and future
    const now = new Date();
    const past = [];
    const present = [];
    const future = [];

    appointments.forEach((appointment) => {
      const appointmentDateTime = new Date(
        `${appointment.date}T${appointment.time}`
      );
      if (appointmentDateTime < now) {
        past.push(appointment);
      } else if (
        appointmentDateTime.toDateString() === now.toDateString() &&
        appointmentDateTime.getHours() === now.getHours() &&
        appointmentDateTime.getMinutes() === now.getMinutes()
      ) {
        present.push(appointment);
      } else {
        future.push(appointment);
      }
    });

    // Respond with categorized appointments
    res.json({ past, present, future });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
