const mongoose = require("mongoose");

const testAppointmentModel = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },

    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Center",
      required: true,
    },
    tests: [{ type: mongoose.Schema.Types.ObjectId, ref: "Test" }],
    appointmentDate: {
      type: String,
      required: true,
    },
    appointmentTime: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "unpaid", "cancelled"],
      default: "unpaid",
    },
    status: {
      type: String,
      enum: ["pending", "booked", "completed", "cancelled"],
      default: "pending",
    },
    invoiceGenerated: { type: Boolean, default: false },
    paymentIntentId: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TestAppointment", testAppointmentModel);
