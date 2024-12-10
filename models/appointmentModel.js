const mongoose = require("mongoose");

const appointmentModel = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  docId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  slotDate: { type: String, required: true },
  slotTime: { type: String, required: true },
  userData: {
    type: {
      name: String,
      email: String,
    },
    required: true,
  },
  docData: {
    type: {
      name: String,
      specialty: String,
      address: String,
    },
    required: true,
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
  cancelledAt: { type: Date },
});

appointmentModel.index({ userId: 1, docId: 1, slotDate: 1 });

module.exports =
  mongoose.models.Appointment ||
  mongoose.model("Appointment", appointmentModel);
