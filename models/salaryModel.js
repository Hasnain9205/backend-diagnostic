const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Employee",
  },
  employeeName: String,
  centerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Center",
    required: true,
  },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  totalSalary: { type: Number, required: true },
  month: Number,
  year: Number,
  paymentStatus: {
    type: String,
    enum: ["Paid", "Partial", "Unpaid"],
    default: "Unpaid",
  },
  paymentMethod: String,
  paymentDate: Date,
});

module.exports = mongoose.model("Salary", salarySchema);
