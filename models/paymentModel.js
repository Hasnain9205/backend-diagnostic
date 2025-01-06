const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    totalPrice: { type: Number, required: true },
    category: { type: String, required: true },
    paymentDate: { type: Date, default: Date.now },
    paymentStatus: {
      type: String,
      enum: ["succeeded", "failed", "pending"],
      required: true,
    },
    paymentId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
