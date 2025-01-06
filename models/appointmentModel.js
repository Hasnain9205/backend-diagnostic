const mongoose = require("mongoose");

const appointmentModel = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  docId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  centerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Center",
    required: true,
  },
  slotDate: { type: String, required: true },
  slotTime: { type: String, required: true },
  userData: {
    type: Object,
  },
  docData: {
    type: Object,
  },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now }, // Set default to the current date and time
  payment: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["booked", "pending", "completed", "cancelled"],
    default: "pending",
  },
  paymentIntentId: { type: String },
  cancelledAt: { type: Date, default: Date.now },
});

appointmentModel.index({ userId: 1, docId: 1, slotDate: 1 });

module.exports =
  mongoose.models.Appointment ||
  mongoose.model("Appointment", appointmentModel);
