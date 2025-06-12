const employeeModel = require("../models/employeeModel");
const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");
const salaryModel = require("../models/salaryModel");
const Stripe = require("stripe");
const centerRevenueModel = require("../models/centerRevenueModel");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const sanitize = require("sanitize-filename");

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
      profileImage,
    } = req.body;

    if (!profileImage) {
      return res
        .status(400)
        .json({ success: false, message: "Image URL is required" });
    }

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
      profileImage,
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
      profileImage,
      employeeId: savedEmployee._id,
    });

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employee: savedEmployee,
      user: newEmployeeUser,
    });
  } catch (error) {
    console.log("createEmployee Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

//get all employee
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await employeeModel.find().populate("centerId");
    if (!employees) {
      return res.status(404).json({ success: true, msg: "Employee not found" });
    }
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

//get employee by center id
exports.getAllEmployeesByCenterId = async (req, res) => {
  try {
    const userCenterId = req.user.centerId;
    const { name, position } = req.query;

    if (!userCenterId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Center ID not found.",
      });
    }
    const filter = { centerId: userCenterId };
    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }
    if (position) {
      filter.position = { $regex: position, $options: "i" };
    }
    const employees = await employeeModel.find(filter).populate("centerId");

    res.status(200).json({
      success: true,
      message: "Employees fetched successfully",
      employees,
    });
  } catch (error) {
    console.log("getEmployeesByCenter Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch employees",
      error: error.message,
    });
  }
};

//get employee by id
exports.getEmployeeById = async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await employeeModel.findById(id).populate("centerId");
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, msg: "Employee not found" });
    }
    res.status(200).json({
      success: true,
      msg: "Get employee by id successfully",
      employee,
    });
  } catch (error) {
    console.log("getEmployeeById Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching employee",
      error: error.message,
    });
  }
};

//update employee
exports.updateEmployee = async (req, res) => {
  const { id } = req.params;
  const {
    centerId,
    name,
    email,
    phone,
    position,
    department,
    salary,
    hireDate,
    status,
    profileImage,
  } = req.body;

  try {
    const employee = await employeeModel.findById(id);
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, msg: "Employee not found" });
    }

    const updatedData = {
      centerId: centerId || employee.centerId,
      name: name || employee.name,
      email: email || employee.email,
      phone: phone || employee.phone,
      position: position || employee.position,
      department: department || employee.department,
      salary: salary || employee.salary,
      hireDate: hireDate || employee.hireDate,
      status: status || employee.status,
      profileImage: profileImage || employee.profileImage,
    };

    const updatedEmployee = await employeeModel.findByIdAndUpdate(
      id,
      updatedData,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    console.log("updateEmployee Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update employee",
      error: error.message,
    });
  }
};

//delete employee
exports.deleteEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await employeeModel.findById(id);
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, msg: "Employee not found" });
    }

    await Promise.all([
      employeeModel.findByIdAndDelete(id),
      userModel.deleteOne({ employeeId: id }),
    ]);

    return res
      .status(200)
      .json({ success: true, msg: "Employee deleted successfully" });
  } catch (error) {
    console.error("Delete employee error:", error.message);
    return res.status(500).json({
      success: false,
      msg: "Failed to delete employee",
      error: error.message,
    });
  }
};

// Pay salary
exports.giveSalary = async (req, res) => {
  try {
    const {
      employeeId,
      name,
      amount,
      paymentMethod,
      centerId,
      stripeToken,
      email,
    } = req.body;

    if (!centerId || !employeeId || !amount) {
      return res.status(400).json({
        success: false,
        message: "centerId, employeeId and amount are required.",
      });
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const monthName = now.toLocaleString("default", { month: "long" });
    const currentYear = now.getFullYear();
    const centerObjectId = new mongoose.Types.ObjectId(centerId);

    const employee = await employeeModel.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    const totalSalary = employee.salary || 0;

    let existingSalary = await salaryModel.findOne({
      employeeId,
      month: currentMonth,
      year: currentYear,
    });

    if (existingSalary && existingSalary.paidAmount >= totalSalary) {
      return res.status(400).json({
        success: false,
        message: "Salary already fully paid for this month.",
      });
    }

    const revenueDocCheck = await centerRevenueModel.findOne({
      centerId: centerObjectId,
      month: currentMonth,
      year: currentYear,
    });

    if (revenueDocCheck && revenueDocCheck.netProfit < amount) {
      return res.status(400).json({
        success: false,
        message: "Not enough net profit to pay salary.",
      });
    }

    // Stripe payment
    const charge = await stripe.charges.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      description: `Salary payment for ${name} (${employeeId})`,
      source: stripeToken,
    });

    if (!charge || charge.status !== "succeeded") {
      return res.status(400).json({ message: "Payment failed." });
    }

    if (existingSalary) {
      existingSalary.paidAmount += amount;
      existingSalary.dueAmount = Math.max(
        totalSalary - existingSalary.paidAmount,
        0
      );
      existingSalary.paymentStatus =
        existingSalary.paidAmount >= totalSalary ? "Paid" : "Partial";
      existingSalary.paymentDate = new Date();
      await existingSalary.save();
    } else {
      existingSalary = await salaryModel.create({
        employeeId,
        employeeName: name,
        centerId: centerObjectId,
        paidAmount: amount,
        dueAmount: Math.max(totalSalary - amount, 0),
        totalSalary,
        month: currentMonth,
        year: currentYear,
        paymentMethod,
        paymentStatus: "Paid",
        paymentDate: new Date(),
      });
    }

    const revenueDoc = await centerRevenueModel.findOneAndUpdate(
      { centerId: centerObjectId, month: currentMonth, year: currentYear },
      { $inc: { totalCost: amount, netProfit: -amount } },
      { new: true, upsert: true }
    );

    // 📄 Generate PDF Salary Slip
    const folderPath = path.join(__dirname, "../pdfs");
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const safeFileName = sanitize(
      `salary_${name}_${monthName}_${currentYear}.pdf`
    );
    const pdfPath = path.join(folderPath, safeFileName);

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(pdfPath));
    doc.fontSize(20).text("Salary Slip", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Employee Name: ${name}`);
    doc.text(`Employee ID: ${employeeId}`);
    doc.text(`Month: ${monthName} ${currentYear}`);
    doc.text(`Paid Amount: $${amount}`);
    doc.text(`Remaining Due: $${existingSalary.dueAmount}`);
    doc.text(`Payment Date: ${new Date().toLocaleDateString()}`);
    doc.end();

    // 📧 Send Email with PDF
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Admin" <${process.env.EMAIL_USER}>`,
      to: email || employee.email,
      subject: "Your Salary Payment",
      html: `
        <h2>Hello ${name},</h2>
        <p>Your salary has been successfully paid for ${monthName} ${currentYear}.</p>
        <p>Amount: <strong>$${amount}</strong></p>
        <p>Remaining Due: <strong>$${existingSalary.dueAmount}</strong></p>
        <p>Thank you for your service.</p>
      `,
      attachments: [
        {
          filename: safeFileName,
          path: pdfPath,
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Salary paid, PDF generated, and email sent.",
      salaryInfo: {
        employeeId,
        employeeName: name,
        paidAmount: amount,
        remainingDue: existingSalary.dueAmount,
        totalSalary,
      },
      revenue: revenueDoc,
    });
  } catch (error) {
    console.error("❌ Error processing salary payment:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

exports.dueSalary = async (req, res) => {
  const { employeeId, year, month } = req.query;

  if (!employeeId || !year || !month) {
    return res.status(400).json({
      message: "employeeId, year, and month are required.",
    });
  }

  try {
    const employee = await employeeModel.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const totalSalary = employee.salary;

    const existing = await salaryModel.findOne({
      employeeId,
      year: Number(year),
      month: Number(month),
    });

    const paid = existing?.paidAmount || 0;
    const due = totalSalary - paid;

    res.status(200).json({
      employeeName: employee.name,
      totalSalary,
      paidAmount: paid,
      dueAmount: due,
    });
  } catch (err) {
    console.error("Error fetching due salary:", err);
    res.status(500).json({ message: "Unable to fetch due amount" });
  }
};

exports.getSalarySheet = async (req, res) => {
  try {
    const { centerId, name, position, month, page = 1, limit = 10 } = req.query;

    const filter = {};
    const employeeFilter = {};

    // Apply center filter
    if (centerId) {
      filter.centerId = centerId;
    }

    // Apply name filter using regex (case-insensitive)
    if (name) {
      employeeFilter.name = { $regex: name, $options: "i" };
    }

    // Apply position filter
    if (position) {
      employeeFilter.position = { $regex: position, $options: "i" };
    }

    // Apply filters for employees (name, position, center)
    const employeeMatchFilter = { ...filter, ...employeeFilter };

    // Find employees
    const matchedEmployees = await employeeModel.find(
      employeeMatchFilter,
      "_id"
    );
    const employeeIds = matchedEmployees.map((emp) => emp._id);

    // Salary filter (based on employeeIds)
    const salaryFilter =
      employeeIds.length > 0
        ? { employeeId: { $in: employeeIds } }
        : { employeeId: null };

    // Validate and apply month filter
    if (month) {
      const validMonths = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      // Normalize the month string to title case and check validity
      const normalizedMonth =
        month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
      const isValidMonth = validMonths.includes(normalizedMonth);

      if (!isValidMonth) {
        return res.status(400).json({
          success: false,
          message: "Invalid month format. Example: January, February, etc.",
        });
      }

      const monthIndex = validMonths.indexOf(normalizedMonth);

      // Set the salary filter to match the selected month
      salaryFilter.paymentDate = {
        $gte: new Date(new Date().getFullYear(), monthIndex, 1),
        $lt: new Date(new Date().getFullYear(), monthIndex + 1, 1),
      };
    }

    // Fetch salaries from database
    const salaries = await salaryModel
      .find(salaryFilter)
      .populate("employeeId", "name email phone position profileImage")
      .sort({ paymentDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalSalaries = await salaryModel.countDocuments(salaryFilter);
    const totalPages = Math.ceil(totalSalaries / limit);

    // Map the salary data for the response
    const sheet = salaries.map((item) => ({
      name: item.employeeId?.name || "N/A",
      email: item.employeeId?.email || "N/A",
      phone: item.employeeId?.phone || "N/A",
      position: item.employeeId?.position || "N/A",
      image: item.employeeId?.profileImage || null,
      paidAmount: item.paidAmount,
      dueAmount: item.dueAmount,
      paymentDate: item.paymentDate,
      paymentStatus: item.paymentStatus,
      month: new Date(item.paymentDate).toLocaleString("default", {
        month: "long",
      }),
      method: item.paymentMethod,
    }));

    // Send response to the client
    res.status(200).json({
      success: true,
      sheet,
      totalSalaries,
      totalPages,
      currentPage: Number(page),
    });
  } catch (err) {
    console.error("Error in getSalarySheet:", err);
    res.status(500).json({
      message: "Failed to fetch salary sheet",
      error: err.message,
    });
  }
};

exports.employeeDashboard = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await employeeModel
      .findById(employeeId)
      .select("-password")
      .populate("centerId", "name address phone");

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const salaryHistory = await salaryModel
      .find({ employeeId })
      .sort({ year: -1, month: -1 });
    return res.status(200).json({
      success: true,
      employee,
      salaryHistory,
    });
  } catch (error) {
    console.error("Error fetching employee dashboard:", error);
    return res.status(500).json({
      message: "Internal server error while fetching employee dashboard",
      error: error.message,
    });
  }
};
