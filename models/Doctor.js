const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  name: String,
  specialization: String,
  email: String,
  availability: [
    {
      date: String, // e.g., "2025-01-19"
      slots: [
        {
          time: String, // e.g., "9:00 AM"
          available: Boolean,
        },
      ],
    },
  ],
});

const Doctor = mongoose.model("Doctor", doctorSchema);

module.exports = Doctor;
