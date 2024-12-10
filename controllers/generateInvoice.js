const PDFDocument = require("pdfkit");
const fs = require("fs");

exports.generateInvoice = async (appointment) => {
  const doc = new PDFDocument();

  // Ensure invoice directory exists
  const invoiceDir = "./invoices";
  if (!fs.existsSync(invoiceDir)) {
    fs.mkdirSync(invoiceDir);
  }

  // Define file path
  const fileName = `invoice_${appointment._id}.pdf`;
  const filePath = `${invoiceDir}/${fileName}`;

  try {
    // Create and save the PDF
    doc.pipe(fs.createWriteStream(filePath));

    doc
      .fillColor("#4A90E2")
      .fontSize(22)
      .text("Diagnostic Center Invoice", { align: "center", valign: "center" });
    doc.moveDown(2);

    // Appointment ID
    doc
      .fillColor("#333333") // Dark gray text
      .fontSize(16)
      .text(`Appointment ID: ${appointment._id}`);
    doc.moveDown();

    // User Details Section
    if (appointment.userId) {
      doc
        .fillColor("#4A90E2")
        .fontSize(14)
        .text("Patient Details:", { underline: true });
      doc.moveDown();
      doc
        .fontSize(12)
        .fillColor("#333333")
        .text(`Name: ${appointment.userId.name || "N/A"}`)
        .text(`Email: ${appointment.userId.email || "N/A"}`)
        .text(`Address: ${appointment.userId.address || "N/A"}`)
        .text(`Gender: ${appointment.userId.gender || "N/A"}`)
        .text(`Phone: ${appointment.userId.phone || "N/A"}`);
    } else {
      doc
        .fontSize(12)
        .fillColor("#333333")
        .text("User information not available.");
    }
    doc.moveDown();

    // Test Details Section with background
    if (appointment.testId) {
      doc
        .fillColor("#4A90E2")
        .fontSize(14)
        .text("Test Details:", { underline: true });
      doc.moveDown();

      doc
        .fontSize(12)
        .fillColor("#333333")
        .text(`Test Name: ${appointment.testId.name || "N/A"}`)
        .text(`Price: $${appointment.testId.price || "N/A"}`)
        .text(`Category: ${appointment.testId.category || "N/A"}`);
      doc.moveDown(2);
    } else {
      doc
        .fontSize(12)
        .fillColor("#333333")
        .text("Test information not available.");
    }
    doc.moveDown();

    // Appointment details
    doc
      .fillColor("#4A90E2")
      .fontSize(14)
      .text("Appointment Details:", { underline: true });
    doc.moveDown();
    doc
      .fillColor("#333333")
      .fontSize(12)
      .text(`Appointment Date: ${appointment.appointmentDate || "N/A"}`)
      .text(`Appointment Time: ${appointment.appointmentTime || "N/A"}`)
      .text(`Payment Status: ${appointment.paymentStatus || "N/A"}`)
      .text(`Status: ${appointment.status || "N/A"}`);
    doc.moveDown();

    doc
      .fillColor("4A90E2")
      .fontSize(12)
      .text("Thank you for choosing our diagnostic center.", {
        align: "center",
      });

    // Finalize PDF and save
    doc.end();

    // Return file path
    return filePath;
  } catch (error) {
    console.error("Error generating invoice:", error);
    throw new Error("Invoice generation failed.");
  }
};
