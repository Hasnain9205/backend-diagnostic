const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImage: { type: String },
    address: { type: Object, default: { line1: "", line2: "" } },
    gender: { type: String, default: "Not Selected" },
    dob: { type: String, default: "Not Selected" },
    phone: { type: String, default: "000000000" },
    speciality: { type: String, default: null },
    degree: { type: String, default: null },
    experience: { type: String, default: null },
    about: { type: String, default: null },
    available: { type: Boolean, default: true },
    fees: { type: Number, default: null },
    date: { type: Date, default: Date.now },

    maxSlots: { type: Number, default: 20 },
    slots_booked: [
      {
        slotDate: { type: Date },
        slotTime: { type: String },
        booked: { type: Boolean, default: false },
      },
    ],
    role: {
      type: String,
      enum: ["admin", "doctor", "diagnostic", "user"],
      default: "user",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
