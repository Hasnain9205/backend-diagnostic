const mongoose = require("mongoose");

const centerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: {
      line1: { type: String },
      line2: { type: String },
    },

    district: { type: String, required: true },
    upazila: { type: String, required: true },
    doctors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    tests: [{ type: mongoose.Schema.Types.ObjectId, ref: "Test" }],

    password: { type: String, required: true },
    profileImage: { type: String },
    phone: {
      type: String,
      required: true,
      match: /^\+?[0-9]{1,4}?[-.●]?[0-9]{1,15}$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
    },

    services: { type: [String], required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { strictPopulate: false }
);

centerSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports =
  mongoose.models.Center || mongoose.model("Center", centerSchema);
