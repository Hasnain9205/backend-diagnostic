const employeeModel = require("../models/employeeModel");
const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");

//create employee
exports.createEmployee = async (req, res) => {
  try {
    const {
      centerId,
      name,
      email,
      password,
      phone,
      position,
      department,
      salary,
      hireDate,
      status,
      image,
    } = req.body;

    // Check if the required fields are provided
    if (
      !centerId ||
      !password ||
      !name ||
      !email ||
      !phone ||
      !position ||
      !salary
    ) {
      return res
        .status(400)
        .json({ error: "All required fields must be filled!" });
    }

    // Check if email already exists
    const existingEmployee = await employeeModel.findOne({ email });
    if (existingEmployee) {
      return res
        .status(400)
        .json({ error: "Employee with this email already exists!" });
    }

    const strongPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPassword.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters, including uppercase, lowercase, a number, and a special character",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    // Create new employee
    const newEmployee = new employeeModel({
      centerId,
      name,
      email,
      phone,
      password: hashPassword,
      position,
      department,
      salary,
      hireDate,
      status,
      image,
    });

    // Save to database
    const savedEmployee = await newEmployee.save();
    const newEmployeeUser = await userModel.create({
      centerId,
      name,
      email,
      phone,
      password: hashPassword,
      position,
      department,
      salary,
      role: "employee",
      hireDate,
      status,
      image,
    });

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employee: savedEmployee,
      savedUser: newEmployeeUser,
    });
  } catch (error) {
    console.log("createEmployee Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
