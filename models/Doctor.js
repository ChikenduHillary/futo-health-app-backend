const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    specialization: { type: String, required: true },
    gender: { type: String, enum: ["male", "female"], required: true },
    accountType: { type: String, default: "doctor" },
    availability: [
      {
        date: { type: String, required: true },
        slots: [
          {
            time: { type: String, required: true },
            available: { type: Boolean, default: true },
          },
        ],
      },
    ],
    appointments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
      },
    ],
  },
  { timestamps: true }
);

const Doctor = mongoose.model("Doctor", doctorSchema);

module.exports = Doctor;
