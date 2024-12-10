const mongoose = require("mongoose");

const TestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true }, // URL of the test image
  category: { type: String, required: true }, // e.g., Blood Test, X-Ray
  price: { type: Number, required: true }, // Price of the test
  description: { type: String }, // Optional detailed description of the test
  status: {
    type: String,
    enum: ["available", "booked", "cancelled"],
    default: "available",
  }, // Test availability status
  createdAt: { type: Date, default: Date.now }, // Creation timestamp
  updatedAt: { type: Date, default: Date.now }, // Last update timestamp
});

// Automatically update `updatedAt` before saving
TestSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Test", TestSchema);
