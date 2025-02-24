const mongoose = require("mongoose");
const prescriptionModel = require("../models/prescriptionModel");
const nodemailer = require("nodemailer");
const userModel = require("../models/userModel");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const path = require("path");

const generatePrescriptionPDF = async (prescription) => {
  try {
    console.log("Generating PDF for prescription:", prescription);
    return new Promise((resolve, reject) => {
      const dirPath = path.resolve("prescriptions");
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      const filePath = path.join(
        dirPath,
        `prescription_${prescription._id}.pdf`
      );
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // **Header Section**
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text(`Dr. ${prescription?.docId?.name || "Unknown"}`, 50, 50);
      doc
        .fontSize(12)
        .font("Helvetica")
        .text(`${prescription?.docId?.degree || "N/A"}`, 50, 70);
      doc.text(`${prescription?.docId?.speciality || "N/A"}`, 50, 90);
      doc.text(`Phone: ${prescription?.docId?.phone || "N/A"}`, 50, 110);

      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text(
          prescription?.centerId?.name || "ABC Diagnostic Center",
          350,
          50,
          { align: "right" }
        );
      doc
        .fontSize(12)
        .font("Helvetica")
        .text(
          `Address: ${prescription?.centerId?.address || "Dhaka, Bangladesh"}`,
          50,
          70,
          { align: "right" }
        );
      doc.text(
        `Contact: ${prescription?.centerId?.phone || "+880 1234 567890"}`,
        50,
        90,
        { align: "right" }
      );

      doc.moveDown(2);

      // **Patient Details with Border**
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text(` Name: ${prescription?.patientId?.name || "Unknown"}`, 50, 160);
      doc.text(
        `Age: ${prescription?.patientId?.age || "N/A"} years`,
        450,
        160,
        { align: "right" }
      );
      doc
        .moveTo(50, doc.y + 5)
        .lineTo(550, doc.y + 5)
        .stroke();
      doc.moveDown(2);

      // **Symptoms & Examinations**
      let startY = doc.y;
      if (prescription.symptoms?.length) {
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Symptoms:", 50, doc.y, { underline: true });
        doc.fontSize(12).font("Helvetica");
        prescription.symptoms.forEach((symptom, index) =>
          doc.text(`${index + 1}. ${symptom}`, 50, doc.y)
        );
        doc.moveDown(1);
      }

      if (prescription.examinations?.length) {
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Examinations:", 50, doc.y, { underline: true });
        doc.fontSize(12).font("Helvetica");
        prescription.examinations.forEach((exam, index) =>
          doc.text(`${index + 1}. ${exam}`, 50, doc.y)
        );
      }

      // **Vertical Line for Separation**
      doc
        .moveTo(300, startY)
        .lineTo(300, doc.y + 20)
        .stroke();

      // **Rx Symbol**
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("Rx", 310, startY, { align: "left" });
      doc.moveDown(1);

      // **Medicines Section**
      if (prescription.medicines?.length) {
        doc.fontSize(12).font("Helvetica");
        prescription.medicines.forEach((medicine, index) =>
          doc.text(
            `${index + 1}. ${medicine.name} - ${medicine.dosage} - ${
              medicine.duration
            }`,
            350,
            doc.y
          )
        );
        doc.moveDown(2);
      }

      // **Additional Notes (Fixed the Syntax Error Here)**
      if (prescription.notes) {
        doc
          .fontSize(12)
          .font("Helvetica")
          .text(prescription.notes, 50, doc.y + 20, { align: "center" });

        doc.moveDown(2);
      }

      // **Doctor Signature**
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Signature:", 50, doc.y + 20);
      doc.text("__________________________", 50, doc.y + 40);
      doc.text(`Dr. ${prescription?.docId?.name || "Unknown"}`, 50, doc.y + 60);

      doc.end();
      stream.on("finish", () => resolve(filePath));
      stream.on("error", (err) => reject(err));
    });
  } catch (error) {
    console.error("Error generating PDF:", error.message);
    throw new Error("Failed to generate PDF");
  }
};

// ইমেইল পাঠানোর ফাংশন
const sendEmailWithAttachment = async (
  to,
  subject,
  text,
  html,
  attachmentPath
) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
      attachments: [
        {
          filename: "Prescription.pdf",
          path: attachmentPath,
          contentType: "application/pdf",
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log("Email with attachment sent successfully");
  } catch (error) {
    console.error("Email sending failed:", error.message);
  }
};

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

    const patient = await userModel.findById(patientId);

    if (!patient || !patient.email) {
      return res.status(400).json({
        success: false,
        msg: "Patient not found or no email associated with the patient.",
      });
    }

    // Prescription তৈরি এবং সংরক্ষণ
    let prescription = new prescriptionModel({
      docId,
      patientId,
      centerId,
      symptoms,
      examinations,
      medicines,
      notes,
    });

    await prescription.save(); // 🔥 প্রথমে save করতে হবে

    // Populate data
    prescription = await prescription.populate(
      "centerId docId patientId",
      "name address phone age degree speciality email"
    );

    // Prescription PDF তৈরি
    const pdfPath = await generatePrescriptionPDF(prescription);

    // ইমেইল পাঠানো
    const patientEmail = patient.email;
    const subject = "Your Medical Prescription is Ready";
    const text = `Dear Patient, your prescription is ready. Please check the attachment.`;
    const html = `<h3>Dear Patient,</h3><p>Your prescription has been generated. Please check the attached PDF file.</p>`;

    await sendEmailWithAttachment(patientEmail, subject, text, html, pdfPath);

    res.status(201).json({
      success: true,
      msg: "Prescription created and sent successfully",
      prescription,
    });
  } catch (error) {
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
