const mongoose = require("mongoose");

const PatientSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Full name
  email: { type: String, required: true }, // Email address
  phoneNumber: { type: String, required: true }, // Phone number
  dateOfBirth: { type: Date, required: true }, // Date of birth
  gender: { type: String, required: true, enum: ["male", "female"] }, // Gender with validation
  healthInfo: { type: String, default: "" }, // Optional health information
  conditions: { type: String, default: "" }, // Optional pre-existing conditions
  medicalHistory: { type: String, default: "" }, // Optional medical history
  accountType: { type: String, required: true }, // Account type
});

module.exports = mongoose.model("Patient", PatientSchema);
