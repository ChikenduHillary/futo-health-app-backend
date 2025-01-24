const express = require("express");
const router = express.Router();
const Patient = require("../models/Patient");

// Get all patients
router.get("/", async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new patient
router.post("/", async (req, res) => {
  const {
    name,
    email,
    phoneNumber,
    dateOfBirth,
    gender,
    healthInfo,
    conditions,
    medicalHistory,
    accountType,
  } = req.body;

  try {
    const newPatient = new Patient({
      name,
      email,
      phoneNumber,
      dateOfBirth,
      gender,
      healthInfo,
      conditions,
      medicalHistory,
      accountType,
    });

    await newPatient.save();
    res.status(201).json(newPatient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
