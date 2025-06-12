const employeeLeaveModel = require("../models/employeeLeaveModel");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

// Function to calculate the difference in days between two dates
const calculateDaysDifference = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Get the difference in time (in milliseconds)
  const differenceInTime = end.getTime() - start.getTime();

  // Convert milliseconds to days
  const differenceInDays = differenceInTime / (1000 * 3600 * 24);
  return differenceInDays;
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.addLeave = async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason, centerId } =
      req.body;

    // validation
    if (
      !employeeId ||
      !leaveType ||
      !startDate ||
      !endDate ||
      !reason ||
      !centerId
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const newLeave = new employeeLeaveModel({
      employeeId,
      centerId,
      leaveType,
      startDate,
      endDate,
      reason,
    });

    await newLeave.save();

    res.status(201).json({
      success: true,
      message: "Leave request submitted successfully",
      data: newLeave,
    });
  } catch (error) {
    console.error("Error adding leave:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while adding leave",
    });
  }
};

exports.allLeave = async (req, res) => {
  try {
    const { centerId } = req.params;
    const leaves = await employeeLeaveModel
      .find({ centerId })
      .populate("employeeId", "name email")
      .sort({ appliedAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get all Employee Leaves",
      data: leaves,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: true, message: "Error for Employee Leaves", error });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["Approved", "Rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }
    const updated = await employeeLeaveModel.findByIdAndUpdate(
      id,
      { status, updatedAt: Date.now() },
      { new: true }
    );
    console.log(updated);
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Leave request not found" });
    }
    const employeeEmail = updated.email;
    if (employeeEmail) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: employeeEmail,
        subject: `Leave Request ${status}`,
        text: `Your leave request for ${updated.leaveType} from ${updated.startDate} to ${updated.endDate} has been ${status}.`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("Error sending email:", error);
          return res.status(500).json({
            success: false,
            message: "Error sending email notification",
            error: error.message,
          });
        }
        console.log("Email sent: " + info.response);
      });
    }
    res.status(200).json({
      success: true,
      message: `Leave ${status.toLowerCase()}`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating leave status",
      error: error.message,
    });
  }
};

exports.getLeaveByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    console.log("Received employeeId:", employeeId);

    // Validate the employeeId format
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employeeId format",
      });
    }

    const leaves = await employeeLeaveModel
      .find({ employeeId: new mongoose.Types.ObjectId(employeeId) })
      .sort({ appliedAt: -1 });

    if (!leaves.length) {
      console.log("⚠ No leaves found for this employeeId");
    }

    // Calculate days difference for each leave
    const leaveDetails = leaves?.map((leave) => {
      const days = calculateDaysDifference(leave.startDate, leave.endDate);
      return { ...leave.toObject(), days: days };
    });

    res.status(200).json({
      success: true,
      message: "Employee leave records fetched successfully",
      data: leaveDetails,
    });
  } catch (error) {
    console.log("❌ Error fetching employee leaves:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching employee leaves",
      error: error.message,
    });
  }
};
