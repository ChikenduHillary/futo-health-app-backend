const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");

// Fetch user details (by ID or email)
router.get("/:identifier", async (req, res) => {
  const { identifier } = req.params;

  try {
    let user;

    // Check if the identifier is an email
    if (identifier.includes("@")) {
      // Search by email
      user =
        (await Doctor.findOne({ email: identifier })) ||
        (await Patient.findOne({ email: identifier }));
    } else {
      // Search by user ID
      user =
        (await Doctor.findById(identifier)) ||
        (await Patient.findById(identifier));
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Determine user role
    const role = user.specialization ? "Doctor" : "Patient";

    res.json({ role, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
