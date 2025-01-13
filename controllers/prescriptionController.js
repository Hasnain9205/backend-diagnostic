const mongoose = require("mongoose");
const prescriptionModel = require("../models/prescriptionModel");

//Create Prescription api
exports.createPrescription = async (req, res) => {
  try {
    const {
      docId,
      patientId,
      centerId,
      symptoms,
      examinations,
      medicines,
      notes,
    } = req.body;
    console.log("Request body:", req.body);
    // Check if any required field is missing or invalid
    if (
      !docId ||
      !patientId ||
      !centerId ||
      !Array.isArray(symptoms) ||
      !symptoms.length ||
      !Array.isArray(examinations) ||
      !examinations.length ||
      !Array.isArray(medicines) ||
      !medicines.length ||
      !notes.trim()
    ) {
      return res.status(400).json({
        success: false,
        msg: "All fields are required and must contain valid data.",
      });
    }

    // Save the prescription to the database
    const prescription = new prescriptionModel({
      docId,
      patientId,
      centerId,
      symptoms,
      examinations,
      medicines,
      notes,
    });

    await prescription.save();

    // Successful response
    res.status(201).json({
      success: true,
      msg: "Prescription created successfully",
      prescription,
    });
  } catch (error) {
    // Error handling and response
    console.error("Error creating prescription:", error.message);
    res.status(500).json({
      success: false,
      error: "Error creating prescription",
      details: error.message,
    });
  }
};

//get  all prescription api
exports.allPrescription = async (req, res) => {
  try {
    const prescriptions = await prescriptionModel
      .find()
      .populate("doctorId", "name speciality")
      .populate("patientId", "name age");
    if (!prescriptions || prescriptions.length === 0) {
      return res
        .status(404)
        .json({ success: false, msg: "No prescriptions found" });
    }

    res.status(200).json({ success: true, prescriptions });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error getting prescription", details: error.message });
  }
};

exports.userPrescription = async (req, res) => {
  try {
    const prescriptions = await prescriptionModel
      .find({
        patientId: req.user._id,
      })
      .populate("docId", "name profileImage");
    if (!prescriptions) {
      return res
        .status(404)
        .json({ success: false, msg: "prescription not found" });
    }
    res
      .status(200)
      .json({ success: true, msg: "User get all Prescription", prescriptions });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch prescriptions" });
  }
};
//get prescription by id
exports.prescriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid prescription ID" });
    }

    const prescription = await prescriptionModel
      .findById(id)
      .populate("docId", "name speciality degree chamber")
      .populate("patientId", "name age")
      .populate("centerId", "name address district upazila phone email");

    console.log("Prescription:", prescription);
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found." });
    }
    res.status(200).json({
      success: true,
      msg: "Prescription fetched successfully",
      prescription,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error getting prescription", details: error.message });
  }
};

// Delete Prescription API
exports.deletePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const prescription = await prescriptionModel.findByIdAndDelete(id);

    if (!prescription) {
      return res
        .status(404)
        .json({ success: false, msg: "Prescription not found" });
    }

    res.status(200).json({
      success: true,
      msg: "Prescription deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: "Error deleting prescription",
      details: error.message,
    });
  }
};

// Update Prescription API
exports.updatePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { doctorId, patientId, symptoms, examinations, medicines, notes } =
      req.body;

    if (
      !doctorId ||
      !patientId ||
      !symptoms ||
      !examinations ||
      !medicines ||
      !notes
    ) {
      return res.status(400).json({
        success: false,
        msg: "All fields are required",
      });
    }

    const updatedPrescription = await prescriptionModel.findByIdAndUpdate(
      id,
      { doctorId, patientId, symptoms, examinations, medicines, notes },
      { new: true }
    );

    if (!updatedPrescription) {
      return res.status(404).json({
        success: false,
        msg: "Prescription not found",
      });
    }

    res.status(200).json({
      success: true,
      msg: "Prescription updated successfully",
      prescription: updatedPrescription,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error updating prescription",
      details: error.message,
    });
  }
};
