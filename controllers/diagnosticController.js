const bcrypt = require("bcrypt");
const validator = require("validator");
const centerModel = require("../models/centerModel");
const userModel = require("../models/userModel");
const testAppointmentModel = require("../models/testAppointmentModel");
const appointmentModel = require("../models/appointmentModel");

//add diagnostic api
exports.addDiagnostic = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      address,
      district,
      upazila,
      profileImage,
      phone,
      services,
      website,
    } = req.body;

    if (!profileImage) {
      return res
        .status(400)
        .json({ success: false, message: "Image URL is required" });
    }

    // Validate required fields
    if (
      !name ||
      !email ||
      !password ||
      !address.line1 ||
      !district ||
      !upazila ||
      !phone ||
      !services
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Validate password strength
    const strongPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPassword.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long, include uppercase, lowercase, a number, and a special character",
      });
    }

    // Check for duplicate email
    const existingCenter = await centerModel.findOne({ email });
    if (existingCenter) {
      return res.status(400).json({
        success: false,
        message: "A diagnostic center with this email already exists",
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new center data
    const centerData = {
      name,
      email,
      password: hashedPassword,
      address,
      district,
      upazila,
      profileImage,
      phone,
      services,
      website,
    };

    const newCenter = new centerModel(centerData);
    await newCenter.save();
    const diagnosticUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
      address,
      district,
      upazila,
      profileImage,
      phone,
      services,
      website,
      role: "diagnostic",
      approved: false,
      centerId: newCenter._id,
    });

    res.status(201).json({
      success: true,
      message: "Diagnostic center added successfully",
      diagnostic: newCenter,
      user: diagnosticUser,
    });
  } catch (error) {
    console.error("Error in addDiagnostic:", error); // Log the actual error
    res.status(500).json({
      success: false,
      message: "An error occurred, please try again",
      error: error.message, // Include the error message in the response for debugging
    });
  }
};

//get all diagnostic api
exports.getAllDiagnostic = async (req, res) => {
  try {
    const diagnostic = await centerModel.find();
    res.status(200).json({
      success: true,
      msg: "Get all diagnostic successfully",
      diagnostic,
    });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

//get diagnostic by id api
exports.getDiagnosticById = async (req, res) => {
  try {
    const diagnostic = await centerModel
      .findById(req.params.id)
      .populate("doctors")
      .populate("tests");
    if (!diagnostic) {
      return res
        .status(404)
        .json({ success: false, msg: "Diagnostic not found" });
    }
    res.status(200).json({
      success: true,
      msg: "Diagnostic get by id successfully",
      diagnostic,
    });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

//get doctor for a specific diagnostic
exports.doctorsForSpecificDiagnostic = async (req, res) => {
  try {
    const { centerId } = req.params;
    const diagnostic = await centerModel.findById(centerId).populate("doctors");
    if (!diagnostic) {
      return res
        .status(404)
        .json({ success: false, msg: "Diagnostic not found" });
    }
    res.status(200).json({
      success: true,
      msg: "Doctor specific diagnostic get successfully",
      doctors: diagnostic.doctors,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, msg: "Server error", error: error.message });
  }
};

//get test for a specific diagnostic
exports.testForSpecificDiagnostic = async (req, res) => {
  try {
    const { centerId } = req.params;

    const center = await centerModel.findById(centerId).populate("tests");
    if (!center) {
      return res
        .status(404)
        .json({ success: false, message: "Center not found" });
    }
    res.status(200).json({ success: true, tests: center.tests });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Server error",
      error: error.message,
    });
  }
};

//update diagnostic api
exports.updateDiagnostic = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedDiagnostic = await centerModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!updatedDiagnostic) {
      return res
        .status(404)
        .json({ success: false, msg: "Diagnostic not found" });
    }
    res.status(200).json({
      success: true,
      msg: "Update diagnostic successfully",
      data: updatedDiagnostic,
    });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

//delete diagnostic api
exports.deleteDiagnostic = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedDiagnostic = await centerModel.findByIdAndDelete(id);
    if (!deletedDiagnostic) {
      return res
        .status(404)
        .json({ success: false, msg: "Diagnostic not found" });
    }
    res.status(200).json({ msg: "Diagnostic deleted successfully" });
  } catch (error) {
    console.error("Error in deleteDiagnostic:", error.message);
    res.status(500).json({
      success: false,
      message: "An error occurred, please try again",
    });
  }
};

//search diagnostic by district, upazila, or services api
exports.searchDiagnostic = async (req, res) => {
  try {
    const { district, upazila, services } = req.query;
    const filters = {};
    if (district) filters.district = district;
    if (upazila) filters.upazila = upazila;
    if (services) filters.services = services;

    const results = await centerModel.find(filters);
    if (results.length === 0) {
      return res
        .status(404)
        .json({ success: false, msg: "No diagnostic found" });
    }
    res.status(200).json({
      success: true,
      msg: "Diagnostic fetched successfully",
      data: results,
    });
  } catch (error) {
    console.error("Error in searchDiagnostic:", error.message);
    res.status(500).json({
      success: false,
      message: "An error occurred, please try again",
    });
  }
};

//get test by center
exports.getTestByCenter = async (req, res) => {
  try {
    const centerId = req.params;
    const center = await centerModel
      .findById(centerId)
      .populate("tests", "name image category description status price");
    if (!center) {
      return res
        .status(404)
        .json({ success: false, message: "Center not found" });
    }
    res.status(200).json({ success: true, tests: center.tests });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching tests", error });
  }
};

// Add doctor API
exports.addDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      speciality,
      degree,
      experience,
      fees,
      address,
      profileImage,
      availableSlots,
      district,
      upazila,
      chamber,
      centerId,
    } = req.body;

    if (!profileImage) {
      return res
        .status(400)
        .json({ success: false, message: "Profile image URL is required" });
    }

    if (fees <= 0) {
      return res.status(400).json({
        success: false,
        message: "Fees must be a positive number",
      });
    }

    if (
      !name ||
      !email ||
      !password ||
      !speciality ||
      !degree ||
      !experience ||
      !fees ||
      !address ||
      !district ||
      !upazila ||
      !chamber ||
      !centerId
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email",
      });
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

    const existingDoctor = await userModel.findOne({ email, role: "doctor" });
    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: "A doctor with this email already exists.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPass = await bcrypt.hash(password, salt);

    const doctorData = {
      name,
      email,
      password: hashPass,
      speciality,
      degree,
      experience,
      fees,
      address,
      district,
      upazila,
      chamber,
      profileImage,
      role: "doctor",
      date: Date.now(),
      slots_booked: [],
    };

    const newDoctor = new userModel(doctorData);
    await newDoctor.save();

    // Add the doctor to the center
    const updatedCenter = await centerModel
      .findByIdAndUpdate(
        centerId,
        { $addToSet: { doctors: newDoctor._id } },
        { new: true }
      )
      .populate("doctors");

    if (!updatedCenter) {
      return res
        .status(404)
        .json({ success: false, message: "Center not found." });
    }

    if (availableSlots && availableSlots.length > 0) {
      const isValidSlots = availableSlots.every(
        (slot) => slot.slotDate && slot.slotTime
      );
      if (!isValidSlots) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid slot data provided" });
      }

      const slots = availableSlots.map((slot) => ({
        slotDate: slot.slotDate,
        slotTime: slot.slotTime,
        booked: false,
      }));

      newDoctor.slots_booked.push(...slots);
      await newDoctor.save();
    }

    res.status(201).json({
      success: true,
      message: "Doctor added successfully along with available slots",
      newDoctor,
    });
  } catch (error) {
    console.error("Error in addDoctor:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "An error occurred, please try again" });
  }
};

//get doctor by center
exports.getDoctorByCenter = async (req, res) => {
  try {
    const centerId = req.params;
    const center = await centerModel
      .findById(centerId)
      .populate(
        "doctors",
        "name email password speciality degree experience fees address profileImage availableSlots district upazila chamber"
      );
    if (!center) {
      return res
        .status(404)
        .json({ success: false, message: "Center not found" });
    }
    res.status(200).json({ success: true, tests: center.tests });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching tests", error });
  }
};

// Diagnostic Dashboard
exports.diagnosticDashboard = async (req, res) => {
  try {
    const { centerId } = req.params;

    const centerData = await centerModel
      .findById(centerId)
      .populate("doctors", "name email phone specialty profileImage")
      .populate("tests", "name description price image status")
      .exec();

    // Check if the center exists
    if (!centerData) {
      return res.status(404).json({ message: "Diagnostic center not found" });
    }

    const tests = centerData.tests || [];
    const doctors = centerData.doctors || [];

    // Get total test appointments for the center
    const totalTestAppointments = await testAppointmentModel.countDocuments({
      centerId,
    });

    // Get total doctor appointments for the center
    const totalDoctorAppointments = await appointmentModel.countDocuments({
      centerId,
    });

    const completedTestAppointments = await testAppointmentModel
      .find({ centerId, status: "completed" })
      .populate("testId", "price")
      .exec();
    console.log("completed...", completedTestAppointments);

    const totalRevenue = completedTestAppointments.reduce(
      (total, appointment) => {
        // Log to check if test and price are available
        console.log("ttt...", appointment.testId);
        if (appointment.testId && appointment.testId.price) {
          return total + appointment.testId.price;
        }
        return total;
      },
      0
    );

    console.log("Total Revenue:", totalRevenue);

    const testCount = tests.length;
    const doctorCount = doctors.length;

    // Return the dashboard data
    return res.status(200).json({
      success: true,
      centerData,
      data: {
        totalRevenue,
        doctorCount,
        testCount,
        totalTestAppointments,
        totalDoctorAppointments,
      },
    });
  } catch (error) {
    console.error("Error fetching diagnostic dashboard data:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

//get testAPpointment
exports.getTestAppointmentByCenter = async (req, res) => {
  try {
    const { centerId } = req.params;

    const testAppointments = await testAppointmentModel
      .find({ centerId })
      .populate("testId", "name category image")
      .populate("userId", "name email profileImage phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      msg: "Get Test appointments successfully by centerId",
      testAppointments,
    });
  } catch (error) {
    console.error("Error fetching test appointments:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

//get doctorAppointments

exports.getDoctorAppointmentByCenter = async (req, res) => {
  try {
    const { centerId } = req.params;

    const testAppointments = await appointmentModel
      .find({ centerId })
      .populate("docId", "name category image")
      .populate("userId", "name email profileImage phone gender address fees ");

    res.status(200).json({
      success: true,
      msg: "Get Test appointments successfully by centerId",
      testAppointments,
    });
  } catch (error) {
    console.error("Error fetching test appointments:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
