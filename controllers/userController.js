const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const appointmentModel = require("../models/appointmentModel");
const centerModel = require("../models/centerModel");
const cloudinary = require("cloudinary").v2;
const mongoose = require("mongoose");

exports.registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      address,
      gender,
      phone,
      district,
      upazila,
      age,
    } = req.body;
    console.log("Body:", req.body);

    if (
      !name ||
      !email ||
      !password ||
      !address ||
      !gender ||
      !phone ||
      !district ||
      !upazila ||
      !age
    ) {
      return res.status(400).json({ msg: "All fields are required" });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ msg: "Enter a valid email" });
    }
    if (!validator.isMobilePhone(phone, "any")) {
      return res.status(400).json({ msg: "Enter a valid phone number" });
    }

    if (password.length < 8) {
      return res.status(400).json({ msg: "Password must be at 8 characters" });
    }
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }
    const saltPass = await bcrypt.genSalt(10);
    const hashPass = await bcrypt.hash(password, saltPass);

    let profileImage = "";
    if (req.file) {
      const fileType = req.file.mimetype.split("/")[0];
      if (fileType !== "image") {
        return res.status(400).json({ msg: "Only image files are allowed." });
      }

      const result = await cloudinary.uploader.upload(req.file.path);
      profileImage = result.secure_url;
    }
    console.log("File:", req.file);
    const userData = {
      name,
      email,
      password: hashPass,
      role: "user",
      profileImage,
      address: address || {},
      gender: gender || "Not Selected",
      phone: phone || "000000000",
      district,
      upazila,
      age,
    };
    const newUser = new userModel(userData);
    await newUser.save();

    res.status(200).json({ msg: "User register successfully", newUser });
  } catch (error) {
    console.error("Registration Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required" });
    }

    // Fetch user by email
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.REFRESH_SECRET,
      { expiresIn: "1d" }
    );

    // Return response
    res.status(200).json({
      msg: "Login successfully",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ msg: "No refresh token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET);
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Generate a new access token
    const newAccessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Refresh token expired. Please login again." });
    }
    return res.status(403).json({ message: "Invalid refresh token" });
  }
};

//get user Profile api

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("userId==========>", userId);
    const user = await userModel.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    return res
      .status(200)
      .json({ msg: "Users profile get successfully", user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//update user api

exports.updateUserProfile = async (req, res) => {
  try {
    const { name, phone, address, dob, gender, image } = req.body;

    // Validate data (this is basic, consider using Joi or similar libraries)
    if (!name || !phone || !address || !dob || !gender) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // Log the user ID for debugging
    console.log("User ID from request:", req.user.id);

    // Update the user's profile
    const updatedUser = await userModel.findByIdAndUpdate(
      req.user.id,
      { name, phone, address, dob, gender, image },
      { new: true } // Return the updated document
    );

    // If no user is found
    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Respond with success
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.bookAppointment = async (req, res) => {
  const { userId, docId, centerId, slotDate, slotTime } = req.body;
  console.log("Request Body:", req.body);

  try {
    // Validate required fields
    if (!userId || !docId || !centerId || !slotDate || !slotTime) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate ObjectId
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(docId) ||
      !mongoose.Types.ObjectId.isValid(centerId)
    ) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Prevent past date selection
    if (
      new Date(slotDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)
    ) {
      return res.status(400).json({
        message: "Cannot book a Doctor appointment for a past date",
      });
    }

    // Convert IDs to ObjectId
    const docIdObjectId = new mongoose.Types.ObjectId(docId);
    const userIdObjectId = new mongoose.Types.ObjectId(userId);
    const centerIdObjectId = new mongoose.Types.ObjectId(centerId);

    // Fetch doctor, user, and center data
    const doctor = await userModel.findById(docIdObjectId);
    const user = await userModel.findById(userIdObjectId);
    const center = await centerModel.findById(centerIdObjectId);

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!center) return res.status(404).json({ message: "Center not found" });

    // Check if the slot is already booked
    const isSlotBooked = doctor.slots_booked.some((slot) => {
      return (
        new Date(slot.slotDate).toISOString().split("T")[0] ===
          new Date(slotDate).toISOString().split("T")[0] &&
        slot.slotTime === slotTime &&
        slot.booked
      );
    });

    if (isSlotBooked) {
      return res.status(400).json({ message: "This slot is already booked" });
    }

    // Create appointment
    const appointment = new appointmentModel({
      userId: userIdObjectId,
      docId: docIdObjectId,
      centerId: centerIdObjectId,
      slotDate,
      slotTime,
      amount: doctor.fees,
      docData: {
        name: doctor.name,
        specialty: doctor.speciality || "General",
        address: doctor.address,
      },
      userData: {
        name: user.name,
        email: user.email,
      },
      date: new Date(),
    });

    await appointment.save();

    // Mark the slot as booked
    doctor.slots_booked.forEach((slot) => {
      if (
        new Date(slot.slotDate).toISOString().split("T")[0] ===
          new Date(slotDate).toISOString().split("T")[0] &&
        slot.slotTime === slotTime
      ) {
        slot.booked = true;
      }
    });

    await doctor.save();

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ message: "Error while booking appointment" });
  }
};

// Fetch all appointments for the logged-in user
exports.getAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const appointments = await appointmentModel
      .find({ userId })
      .populate("docId", "name specialty address fees")
      .sort({ date: -1 });

    const appointmentDetails = appointments.map((appointment) => ({
      ...appointment._doc,
      isPaid: appointment.payment ? "Paid" : "Pending",
      paymentStatus: appointment.payment
        ? appointment.payment.status
        : "Unpaid",
    }));

    res.status(200).json({
      msg: "Appointments and payment details fetched successfully",
      appointments: appointmentDetails,
    });
  } catch (error) {
    console.error("Error fetching appointments and payment details:", error);
    return res.status(500).json({ message: "Error fetching appointments" });
  }
};

//Cancel appointment api

exports.cancelAppointment = async (req, res) => {
  const appointmentId = req.params.id;

  try {
    // Find the appointment by ID
    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Ensure the user is authorized to cancel the appointment
    if (appointment.userId.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to cancel this appointment" });
    }

    // Update the appointment status to 'cancelled'
    appointment.status = "cancelled";
    await appointment.save();

    // Respond with a success message
    return res
      .status(200)
      .json({ message: "Appointment cancelled successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error cancelling appointment" });
  }
};

//update role api

exports.updateRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, employeeId } = req.body;
    const validRoles = ["doctor", "diagnostic", "admin", "user", "employee"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ msg: "Invalid role Specified" });
    }
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "user not found" });
    }
    user.role = role;
    if (role === "employee") {
      if (!employeeId) {
        return res
          .status(400)
          .json({ message: "Employee ID is required for employee role" });
      }
      user.employeeId = employeeId;
    } else {
      user.employeeId = undefined;
    }
    await user.save();
    res.status(200).json({ msg: "user role updated successfully", user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await userModel.find();
    res.status(200).json({
      msg: "Fetched all users successfully",
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
};
