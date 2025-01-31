const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID of the user (doctor or patient)
  message: { type: String, required: true }, // Notification message
  read: { type: Boolean, default: false }, // Whether the notification has been read
  createdAt: { type: Date, default: Date.now }, // Timestamp of the notification
});

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
