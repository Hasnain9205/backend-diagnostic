const mongoose = require("mongoose");

const centerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: {
    line1: { type: String, required: true },
    line2: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
  },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  services: { type: [String], required: true }, // List of services offered
  website: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

centerSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports =
  mongoose.models.Center || mongoose.model("Center", centerSchema);
