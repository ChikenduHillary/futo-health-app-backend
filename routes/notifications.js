const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");

// Get all notifications for a user by email
router.get("/:email", async (req, res) => {
  const { email } = req.params;

  try {
    // Find the user (doctor or patient) by email
    const doctor = await Doctor.findOne({ email });
    const patient = await Patient.findOne({ email });

    if (!doctor && !patient) {
      return res.status(404).json({ message: "User not found" });
    }

    // Determine the user's ID
    const userId = doctor ? doctor._id : patient._id;

    // Fetch notifications for the user
    const notifications = await Notification.find({ userId }).sort({
      createdAt: -1,
    }); // Sort by most recent first

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark a notification as read
router.put("/:notificationId/read", async (req, res) => {
  const { notificationId } = req.params;

  try {
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.read = true;
    await notification.save();

    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
