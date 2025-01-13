const mongoose = require("mongoose");

const PrescriptionSchema = new mongoose.Schema({
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
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  symptoms: { type: [String], required: true },
  examinations: { type: [String] },
  medicines: [
    {
      name: { type: String, required: true },
      dosage: { type: String, required: true },
      duration: { type: String, required: true },
    },
  ],
  notes: { type: String },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Prescription", PrescriptionSchema);
