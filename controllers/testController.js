const userModel = require("../models/userModel");
const testModel = require("../models/testModel");
const testAppointmentModel = require("../models/testAppointmentModel");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const fs = require("fs");
const path = require("path");
const { generateInvoice } = require("./generateInvoice");
const centerModel = require("../models/centerModel");
const invoiceDir = path.join(__dirname, "../invoices");

// Create Test
exports.createTest = async (req, res) => {
  try {
    const { name, category, price, description, image, centerId } = req.body;

    // Validate if the required fields are present
    if (!name || !category || !price || !description || !image || !centerId) {
      return res.status(400).json({
        success: false,
        message:
          "All fields (name, category, price, description, image) are required",
      });
    }

    // Validate price (ensure it's a positive number)
    if (price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a positive number",
      });
    }
    const newTest = await testModel.create({
      name,
      category,
      price,
      description,
      image,
      centerId,
    });
    if (!newTest) {
      return res
        .status(404)
        .json({ success: false, msg: "Failed to create test" });
    }
    // Add the test to the center
    const updatedCenter = await centerModel
      .findByIdAndUpdate(
        centerId,
        { $addToSet: { tests: newTest._id } },
        { new: true }
      )
      .populate("tests");

    if (!updatedCenter) {
      return res
        .status(404)
        .json({ success: false, message: "Center not found." });
    }

    // Send success response with the newly created test
    res.status(201).json({
      success: true,
      message: "Test created successfully",
      data: {
        test: newTest,
        center: updatedCenter,
      },
    });
  } catch (error) {
    // Handle any errors that occur during the process
    console.error("Error creating test:", error.message);
    res.status(500).json({
      success: false,
      message: "An error occurred while creating the test",
      error: error.message,
    });
  }
};

// Get Test by ID
exports.getTestById = async (req, res) => {
  try {
    const test = await testModel.findById(req.params.testId);
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }
    res.status(200).json({ message: "Test fetched successfully", test });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching test", error: error.message });
  }
};

// Get All Tests
exports.getAllTest = async (req, res) => {
  try {
    const tests = await testModel.find();
    res.status(200).json({ message: "Tests fetched successfully", tests });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching tests", error: error.message });
  }
};

// Update Test
exports.updateTest = async (req, res) => {
  const { id } = req.params;
  const { name, category, price, description } = req.body;

  // Input validation
  if (!name || !category || price <= 0 || !description) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid input data" });
  }

  try {
    const updatedTest = await testModel.findByIdAndUpdate(
      id,
      { name, category, price, description },
      { new: true, runValidators: true }
    );

    if (!updatedTest) {
      return res
        .status(404)
        .json({ success: false, message: "Test not found" });
    }

    res.status(200).json({ success: true, test: updatedTest });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update test", error });
  }
};

exports.deleteTest = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedTest = await testModel.findByIdAndDelete(id);

    if (!deletedTest) {
      return res
        .status(404)
        .json({ success: false, message: "Test not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Test deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete test", error });
  }
};

// Cancel Test Appointment
exports.cancelTest = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await testAppointmentModel.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.paymentStatus === "paid") {
      return res.status(400).json({
        message: "Cannot cancel an appointment that is already paid.",
      });
    }
    appointment.status = "cancelled";
    appointment.paymentStatus = "cancelled";
    await appointment.save();

    res
      .status(200)
      .json({ message: "Test appointment cancelled successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error cancelling test", error: error.message });
  }
};

//book test
exports.bookTest = async (req, res) => {
  const {
    userId,
    testId,
    centerId,
    appointmentDate,
    appointmentTime,
    paymentStatus = "unpaid",
  } = req.body;

  try {
    if (
      !userId ||
      !testId ||
      !centerId ||
      !appointmentDate ||
      !appointmentTime
    ) {
      return res.status(400).json({
        message:
          "All fields are required: userId, testId,centerId, appointmentDate, appointmentTime.",
      });
    }

    // Validate user and test existence
    const [user, test, center] = await Promise.all([
      userModel.findById(userId),
      testModel.findById(testId),
      centerModel.findById(centerId),
    ]);

    if (!user) return res.status(404).json({ message: "User not found." });
    if (!test) return res.status(404).json({ message: "Test not found." });
    if (!center) return res.status(404).json({ message: "Center not found." });

    // Check for existing appointment
    const existingAppointment = await testAppointmentModel.findOne({
      testId,
      appointmentDate,
      appointmentTime,
    });

    if (existingAppointment) {
      return res.status(400).json({
        message: "The test is already booked for this date and time.",
      });
    }

    const newAppointment = await testAppointmentModel.create({
      userId,
      testId,
      centerId,
      appointmentDate,
      appointmentTime,
      status: paymentStatus === "paid" ? "booked" : "pending",
      paymentStatus,
    });

    res.status(201).json({
      message: "Test booked successfully.",
      appointment: newAppointment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error booking test",
      error: error.message,
    });
  }
};

//Get test appointment
exports.getTestAppointment = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res
        .status(400)
        .json({ success: false, message: "User not authenticated." });
    }

    const userId = req.user.id;
    const testAppointments = await testAppointmentModel
      .find({ userId })
      .populate("testId", "name price category")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "All appointments retrieved successfully.",
      testAppointments,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

//completed test appointment

exports.completedTestAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  try {
    const appointment = await testAppointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ msg: "Appointment not found" });
    }
    appointment.status = "completed";
    await appointment.save();

    res.status(200).json({
      message: "Appointment marked as completed successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error completing appointment:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.updateTestAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedAppointment = await testAppointmentModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedAppointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.status(200).json({
      message: "Appointment status updated successfully",
      updatedAppointment,
    });
  } catch (error) {
    console.error("Error updating appointment status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.payment = async (req, res) => {
  const { unpaidAppointments } = req.body;

  // Calculate the total amount for all unpaid appointments
  const totalAmount = unpaidAppointments.reduce((total, appointment) => {
    const price = appointment.testId?.price;
    if (isNaN(price) || price <= 0) {
      return total; // If price is invalid, just return the total so far
    }
    return total + price;
  }, 0);

  // Convert amount to the smallest currency unit (cents for USD)
  const amountInCents = totalAmount * 100;

  try {
    // Create a payment intent with the total amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd", // Adjust to your preferred currency
      payment_method_types: ["card"],
    });

    // Send the client secret to the frontend
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.paymentHistory = async (req, res) => {
  const userId = req.user.id; // Assuming you're using JWT for authentication

  try {
    // Fetch payment details for all appointments of the logged-in user
    const appointments = await testAppointmentModel
      .find({ userId })
      .populate("testId", "name price") // Populate test details
      .populate("docId", "name specialty address fees") // Populate doctor details
      .sort({ createdAt: -1 }); // Sort by the most recent

    if (!appointments || appointments.length === 0) {
      return res.status(404).json({ message: "No payment history found." });
    }

    const paymentDetails = appointments.map((appointment) => ({
      ...appointment._doc,
      paymentStatus: appointment.paymentStatus || "Pending", // Default to "Pending" if no payment status
      paymentInfo: appointment.paymentIntentId
        ? { paymentIntentId: appointment.paymentIntentId }
        : {},
    }));

    res.status(200).json({
      message: "Payment history fetched successfully",
      payments: paymentDetails,
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({ message: "Error fetching payment history" });
  }
};

exports.paymentSuccess = async (req, res) => {
  const { appointmentIds, sessionId } = req.body;

  if (!appointmentIds || !sessionId) {
    return res.status(400).json({
      message: "Missing required fields: appointmentIds or sessionId",
    });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(sessionId);

    if (paymentIntent.status === "succeeded") {
      // Update appointment status in the database
      try {
        await testAppointmentModel.updateMany(
          { _id: { $in: appointmentIds } },
          {
            $set: {
              status: "booked",
              paymentStatus: "paid",
              invoiceGenerated: true,
            },
          }
        );
      } catch (dbError) {
        console.error("Error updating appointments:", dbError);
        return res
          .status(500)
          .json({ message: "Failed to update appointment statuses" });
      }

      // Fetch updated appointments
      const appointments = await testAppointmentModel
        .find({ _id: { $in: appointmentIds } })
        .populate({
          path: "userId",
          select: "name email address phone gender",
        })
        .populate({
          path: "testId",
          select: "name price category description",
        });

      if (appointments.length === 0) {
        return res
          .status(404)
          .json({ message: "No appointments found to update" });
      }

      const invoicePaths = [];
      const failedInvoices = [];

      for (const appointment of appointments) {
        try {
          const invoicePath = await generateInvoice(appointment);
          invoicePaths.push(invoicePath);
        } catch (invoiceError) {
          console.error(
            "Error generating invoice for appointment:",
            appointment._id,
            invoiceError
          );
          failedInvoices.push({
            appointmentId: appointment._id,
            error: invoiceError.message || "Unknown error",
          });
        }
      }

      return res.status(200).json({
        message: "Payment successful, appointments updated.",
        invoicePaths,
        failedInvoices,
      });
    } else {
      return res.status(400).json({ message: "Payment was not successful" });
    }
  } catch (error) {
    console.error("Error confirming payment:", error);

    if (error.type === "StripeCardError") {
      return res.status(400).json({ message: "Card payment failed" });
    } else if (error.type === "StripeInvalidRequestError") {
      return res.status(400).json({ message: "Invalid payment request" });
    } else {
      return res
        .status(500)
        .json({ message: "Internal server error, please try again later" });
    }
  }
};

//get invoice
exports.getInvoice = async (req, res) => {
  try {
    if (!fs.existsSync(invoiceDir)) {
      return res.status(200).json({ invoices: [] });
    }

    const invoices = fs.readdirSync(invoiceDir).map((file) => {
      const [_, appointmentId] = file.split("_");
      return {
        fileName: file,
        appointmentId: appointmentId.replace(".pdf", ""),
      };
    });

    res.status(200).json({ invoices });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices." });
  }
};

//download invoice

exports.downloadInvoice = async (req, res) => {
  const { appointmentId } = req.params;
  const fileName = `invoice_${appointmentId}.pdf`;
  const filePath = path.join(invoiceDir, fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Invoice not found." });
  }

  res.download(filePath, fileName, (err) => {
    if (err) {
      console.error("Error during file download:", err);
      res.status(500).send("Failed to download invoice.");
    }
  });
};
