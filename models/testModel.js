const mongoose = require("mongoose");

const TestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  centerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Center",
    required: true,
  },
  status: {
    type: String,
    enum: ["available", "booked", "cancelled"],
    default: "available",
  }, // Test availability status
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

TestSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Test", TestSchema);
