const Invoice = require("../models/invoiceModel");
const PDFDocument = require("pdfkit");

// Create invoice API
exports.createInvoice = async (req, res) => {
  const { userId, testAppointments } = req.body;

  try {
    // Aggregate test details
    const tests = testAppointments.map((appointment) => ({
      test: appointment.testId,
      testName: appointment.name,
      testCategory: appointment.category,
      price: appointment.price,
    }));

    const totalPrice = tests.reduce((total, item) => total + item.price, 0);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    // Create and save the invoice
    const invoice = new Invoice({
      user: userId,
      tests,
      totalPrice,
      dueDate,
    });

    await invoice.save();
    res.status(201).json({ message: "Invoice created successfully", invoice });
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ message: "Failed to create invoice" });
  }
};

// Get all invoices API
exports.getAllInvoices = async (req, res) => {
  try {
    const { userId } = req.query; // Pass userId as query parameter
    const filter = userId ? { user: userId } : {};

    const invoices = await Invoice.find(filter)
      .populate("user", "name")
      .populate("tests.test");
    res.status(200).json({ invoices });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ message: "Failed to fetch invoices" });
  }
};

// Get invoice by userId API
exports.getInvoiceByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const invoices = await Invoice.find({ user: userId }).populate(
      "user",
      "name email"
    );
    if (!invoices || invoices.length === 0) {
      return res.status(404).json({ msg: "No invoices found for this user" });
    }
    res.status(200).json({ msg: "Invoices fetched successfully", invoices });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get invoices by userId",
      error: error.message,
    });
  }
};

exports.updateInvoice = async (req, res) => {
  const { invoiceId } = req.params;

  try {
    const invoice = await Invoice.findByIdAndUpdate(
      invoiceId,
      { paymentStatus: "paid" },
      { new: true }
    );

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    res.status(200).json({ message: "Invoice marked as paid", invoice });
  } catch (error) {
    console.error("Error marking invoice as paid:", error);
    res.status(500).json({ message: "Failed to update invoice status" });
  }
};

// Delete invoice API
exports.deleteInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const deletedInvoice = await Invoice.findByIdAndDelete(invoiceId);
    if (!deletedInvoice) {
      return res.status(404).json({ msg: "Invoice not found" });
    }
    res.status(200).json({ msg: "Invoice deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete invoice", error: error.message });
  }
};

// Function to generate and download invoice PDF
exports.downloadPdf = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Find the invoice by ID
    const invoice = await Invoice.findById(invoiceId).populate(
      "user",
      "name email"
    );

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Create a new PDF document
    const doc = new PDFDocument();

    // Set the response header for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice_${invoice._id}.pdf`
    );

    // Pipe the document to the response
    doc.pipe(res);

    // Add title and other details to the PDF
    doc.fontSize(18).text("Invoice", { align: "center" });
    doc.moveDown(2);
    doc.fontSize(12).text(`Invoice ID: ${invoice._id}`);
    doc.text(`User: ${invoice.user.name}`);
    doc.text(`Email: ${invoice.user.email}`);
    doc.text(`Total Price: $${invoice.totalPrice}`);
    doc.text(`Payment Status: ${invoice.paymentStatus}`);
    doc.text(`Due Date: ${invoice.dueDate}`);

    doc.moveDown(2);
    doc.text("Tests:", { underline: true });
    invoice.tests.forEach((test) => {
      doc.text(`- ${test.testName} (${test.testCategory}): $${test.price}`);
    });

    // End the document and send it to the client
    doc.end();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error generating PDF", error: error.message });
  }
};
