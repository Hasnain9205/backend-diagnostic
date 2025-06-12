const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema({
  centerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Center",
    required: true,
  },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  position: { type: String, required: true },
  department: { type: String },
  salary: { type: Number, required: true },
  hireDate: { type: Date, default: Date.now },
  profileImage: { type: String, required: true },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
EmployeeSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports =
  mongoose.models.Employee || mongoose.model("Employee", EmployeeSchema);
