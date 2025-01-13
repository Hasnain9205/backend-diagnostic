const appointmentModel = require("../models/appointmentModel");
const userModel = require("../models/userModel");
const mongoose = require("mongoose");

// get doctorDetails api
exports.doctorDetails = async (req, res) => {
  try {
    const docId = req.params.id;
    const doctor = await userModel.findById(docId);
    if (!doctor) {
      return res.status(404).json({ msg: "Doctor not found" });
    }
    const slotsAvailable = doctor.slots_booked.some((slot) => !slot.booked);
    doctor.available = slotsAvailable;
    await doctor.save();

    return res.status(200).json({
      msg: "Doctor details retrieved successfully",
      doctor: {
        ...doctor.toObject(),
        available: doctor.available,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

//All doctor list
exports.doctorList = async (req, res) => {
  try {
    const doctors = await userModel
      .find({ role: "doctor" })
      .select("-password -email")
      .sort({ name: 1 });
    if (!doctors || doctors.length === 0) {
      return res.status(404).json({ msg: "No doctors found" });
    }
    return res.status(200).json({
      msg: "Doctor list fetched successfully",
      doctors,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      msg: "Failed to fetch doctors. Please try again later.",
      error: error.message,
    });
  }
};
//filter doctor api
exports.filterDoctor = async (req, res) => {
  try {
    const { district, upazila, specialty } = req.query;
    const filters = {};
    if (district) filters.district = district;
    if (upazila) filters.upazila = upazila;
    if (specialty) filters.specialty = specialty;
    const doctors = await userModel.find(filters);
    res
      .status(200)
      .json({ success: true, msg: "Filter doctor successfully", doctors });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
//doctor appointment
exports.doctorAppointment = async (req, res) => {
  try {
    const { docId } = req.query;
    if (!docId) {
      return res.status(400).json({ message: "Doctor ID is required" });
    }

    const appointments = await appointmentModel
      .find({ docId })
      .sort({ slotDate: -1 })
      .populate("userId", "name email profileImage address")
      .populate("centerId", "name address district upazila");
    console.log("a...", appointments);

    if (!appointments.length) {
      return res
        .status(404)
        .json({ message: "No appointments found for this doctor" });
    }
    return res.status(200).json({
      msg: "Appointments fetched successfully",
      appointment: appointments,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return res.status(500).json({ message: error.message });
  }
};

//get patient by userId
exports.uniquePatients = async (req, res) => {
  try {
    const { docId } = req.query;
    if (!docId) {
      return res.status(400).json({ message: "Invalid or missing Doctor ID" });
    }

    console.log("Received docId:", docId);

    const appointments = await appointmentModel.find({ docId });
    const uniquePatientIds = [
      ...new Set(
        appointments?.map((appointment) => appointment.userId.toString())
      ),
    ];
    const uniquePatients = await userModel.find({
      _id: { $in: uniquePatientIds },
    });
    res
      .status(200)
      .json({ msg: "unique patients get successfully", uniquePatients });
  } catch (error) {
    console.error("Error fetching uniquePatient:", error);
    return res.status(500).json({ message: error.message });
  }
};

//completed appointment

exports.appointmentComplete = async (req, res) => {
  try {
    const { docId, appointmentId } = req.body;
    console.log("ap.....", docId);
    console.log("ap2.....", appointmentId);
    const appointmentData = await appointmentModel.findById(appointmentId);
    console.log("appoitnemnt...", appointmentData);
    if (appointmentData.status === "completed") {
      return res
        .status(400)
        .json({ msg: "This appointment is already completed" });
    }

    if (!appointmentData) {
      return res.status(404).json({ msg: "Appointment not found" });
    }
    if (appointmentData.docId.toString() !== docId) {
      return res
        .status(400)
        .json({ msg: "Appointment does not belong to this doctor" });
    }
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      isCompleted: true,
      status: "completed",
    });
    return res.status(200).json({ msg: "Appointment completed successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//cancelled appointment for doctor api

exports.appointmentCancel = async (req, res) => {
  try {
    const { docId, appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);
    if (appointmentData.status === "cancelled") {
      return res
        .status(400)
        .json({ msg: "This appointment is already cancelled" });
    }
    if (appointmentData.docId.toString() !== docId) {
      return res
        .status(400)
        .json({ msg: "Appointment does not belong to this doctor" });
    }
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      status: "cancelled",
    });
    return res.status(200).json({ msg: "appointment cancelled" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//doctor dashboard
exports.doctorDashboard = async (req, res) => {
  try {
    const { docId } = req.query;

    if (!docId) {
      return res.status(400).json({ message: "Doctor ID is required" });
    }

    const doctorObjectId = new mongoose.Types.ObjectId(docId); // Fix for ObjectId usage

    // Fetch total earnings, appointments, and unique patients
    const totalEarnings = await appointmentModel.aggregate([
      { $match: { docId: doctorObjectId, payment: true } },
      { $group: { _id: null, earnings: { $sum: "$amount" } } },
    ]);

    const totalAppointments = await appointmentModel.countDocuments({
      docId: doctorObjectId,
    });

    const uniquePatients = await appointmentModel.distinct("userId", {
      docId: doctorObjectId,
    });

    // Fetch latest appointments
    const latestAppointments = await appointmentModel
      .find({ docId: doctorObjectId })
      .sort({ slotDate: -1, slotTime: -1 })
      .limit(5)
      .populate("userId", "name email profileImage phone address");

    // Appointments by Date
    const appointmentsByDate = await appointmentModel.aggregate([
      { $match: { docId: doctorObjectId } },
      {
        $group: {
          _id: "$slotDate",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      dashData: {
        earnings: totalEarnings[0]?.earnings || 0,
        appointments: totalAppointments,
        patients: uniquePatients.length,
        latestAppointments,
        appointmentsByDate,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

//get doctor profile api

exports.doctorProfile = async (req, res) => {
  try {
    const { docId } = req.body;
    const profileData = await userModel.findById(docId).select("-password");
    return res
      .status(200)
      .json({ msg: "Doctor profile get successfully", profileData });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//update doctor profile api

exports.updateDoctorProfile = async (req, res) => {
  try {
    const { docId, fees, address, available } = req.body;
    await userModel.findByIdAndUpdate(docId, { fees, address, available });
    return res.status(200).json({ msg: "Doctor profile updated" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
