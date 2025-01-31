const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: {
    type: String,
    enum: ["booked", "cancelled"],
    default: "booked",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  description: { type: String },
});

module.exports = mongoose.model("Appointment", AppointmentSchema);
