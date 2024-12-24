const bcrypt = require("bcrypt");
const validator = require("validator");
const appointmentModel = require("../models/appointmentModel");
const userModel = require("../models/userModel");
const testAppointmentModel = require("../models/testAppointmentModel");

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
      about,
      fees,
      address,
      profileImage,
      availableSlots,
    } = req.body;

    if (!profileImage) {
      return res
        .status(400)
        .json({ success: false, message: "Image URL is required" });
    }

    if (
      !name ||
      !email ||
      !password ||
      !speciality ||
      !degree ||
      !experience ||
      !about ||
      !fees ||
      !address
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
      about,
      fees,
      address,
      profileImage,
      role: "doctor",
      date: Date.now(),
      slots_booked: [],
    };

    const newDoctor = new userModel(doctorData);
    await newDoctor.save();

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
      message: "Doctor details added successfully along with slots",
      newDoctor,
    });
  } catch (error) {
    console.error("Error in addDoctor:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "An error occurred, please try again" });
  }
};

//get all doctor

exports.allDoctor = async (req, res) => {
  try {
    const doctors = await userModel.find({ role: "doctor" });
    return res
      .status(200)
      .json({ msg: "Get all doctor successfully", doctors });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: error.message });
  }
};

//get doctor by id
exports.getDoctor = async (req, res) => {
  try {
    const doctor = await userModel.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    res.json({ doctor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//update doctor api
exports.updateDoctor = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const {
      name,
      email,
      password,
      image,
      speciality,
      degree,
      experience,
      about,
      fees,
      address,
      available,
    } = req.body;

    if (!doctorId) {
      return res.status(400).json({ message: "Doctor ID is required" });
    }

    const doctor = await userModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    if (password) {
      doctor.password = await bcrypt.hash(password, 10);
    }

    doctor.name = name || doctor.name;
    doctor.email = email || doctor.email;
    doctor.image = image || doctor.image;
    doctor.speciality = speciality || doctor.speciality;
    doctor.degree = degree || doctor.degree;
    doctor.experience = experience || doctor.experience;
    doctor.about = about || doctor.about;
    doctor.fees = fees || doctor.fees;
    doctor.address = address || doctor.address;
    doctor.available = available !== undefined ? available : doctor.available;

    const updatedDoctor = await doctor.save();
    res.status(200).json({
      message: "Doctor updated successfully",
      doctor: updatedDoctor,
    });
  } catch (error) {
    console.error("Error updating doctor:", error);
    res.status(500).json({ message: "Failed to update doctor" });
  }
};

//delete doctor api
exports.deleteDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const associatedAppointments = await appointmentModel.find({
      docId: doctorId,
    });
    if (associatedAppointments.length > 0) {
      return res.status(400).json({
        success: false,
        msg: "Cannot delete doctor with existing appointments",
      });
    }
    const doctor = await userModel.findByIdAndDelete(doctorId);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Doctor deleted successfully" });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

//get testAPpointment

exports.getTestAppointment = async (req, res) => {
  try {
    const testAppointments = await testAppointmentModel
      .find({})
      .populate("testId", "name category image")
      .populate("userId", "name email profileImage phone");
    res.status(200).json({
      success: true,
      msg: "Get all Test appointment successfully",
      testAppointments,
    });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

//all appointment list

exports.appointmentsAdmin = async (req, res) => {
  try {
    const appointments = await appointmentModel
      .find({})
      .populate("userId", "name email phone profileImage");
    return res
      .status(200)
      .json({ msg: "All appointment get successfully", appointments });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: error.message });
  }
};

//appointment cancel admin api
exports.appointmentCancelAdmin = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId) {
      return res
        .status(400)
        .json({ success: false, message: "Appointment ID is required" });
    }

    const appointmentData = await appointmentModel.findById(appointmentId);
    if (!appointmentData) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    if (
      appointmentData.status === "completed" ||
      appointmentData.status === "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message: "This appointment cannot be cancelled again",
      });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      status: "cancelled",
      isCompleted: false,
      cancelledAt: new Date(),
    });

    const { docId, slotDate, slotTime } = appointmentData;
    const doctorData = await userModel.findById(docId);
    if (!doctorData) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    const updatedSlots = doctorData.slots_booked.filter(
      (slot) => !(slot.slotDate === slotDate && slot.slotTime === slotTime)
    );

    doctorData.slots_booked = updatedSlots;
    await doctorData.save();

    return res
      .status(200)
      .json({ success: true, message: "Appointment cancelled successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "An error occurred" });
  }
};

//dashboard api for admin

exports.adminDashboard = async (req, res) => {
  try {
    const doctors = await userModel.find({ role: "doctor" });
    const users = await userModel.find({ role: "user" });
    const testAppointment = await testAppointmentModel.find({});
    const appointments = await appointmentModel
      .find({})
      .populate("userId", "name profileImage email address phone")
      .populate(
        "docId",
        "name email profileImage degree specialty experience about available fees address role"
      )
      .sort({ date: -1 }); // Sorting the appointments by date in descending order here

    const dashData = {
      doctors: doctors.length,
      appointments: appointments.length,
      patients: users.length,
      testAppointments: testAppointment.length,
      latestAppointments: appointments.slice(0, 5),
      doctorAppointments: appointments,
    };

    return res
      .status(200)
      .json({ msg: "All data fetched successfully", dashData, appointments });
  } catch (error) {
    console.error("Error fetching data:", error); // Log the error for debugging
    return res.status(500).json({ message: error.message });
  }
};
