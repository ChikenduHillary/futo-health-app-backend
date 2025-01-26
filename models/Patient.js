const mongoose = require("mongoose");

const PatientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, required: true, enum: ["male", "female"] },
  healthInfo: { type: String, default: "" },
  conditions: { type: String, default: "" },
  medicalHistory: { type: String, default: "" },
  accountType: { type: String, required: true },
});

module.exports = mongoose.model("Patient", PatientSchema);
