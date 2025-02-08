const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  doctorName: { type: String, required: true },
  patientName: { type: String, required: true },
});

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
