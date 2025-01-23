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
        date: String, // Date for availability
        slots: [
          {
            time: String, // Time slot
            available: Boolean, // Availability status
          },
        ],
      },
    ],
  },
  { timestamps: true }
); // Automatically adds `createdAt` and `updatedAt` fields

const Doctor = mongoose.model("Doctor", doctorSchema);

module.exports = Doctor;
