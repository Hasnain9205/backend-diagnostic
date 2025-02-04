const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const appointmentModel = require("../models/appointmentModel");
const nodemailer = require("nodemailer");

exports.payment = async (req, res) => {
  try {
    const { unpaidAppointments } = req.body;

    const appointmentIds = unpaidAppointments.map(
      (appointment) => appointment._id
    );

    const line_items = unpaidAppointments.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.docData.name },
        unit_amount: Math.round(item.amount * 100), // Convert to cents
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      metadata: { appointmentIds: JSON.stringify(appointmentIds) },
      success_url: `${
        process.env.URL
      }/success?appointmentIds=${appointmentIds.join(
        ","
      )}&sessionId={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL}/cancel`,
    });

    res.send({ url: session.url });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).send({ error: error.message });
  }
};

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.paymentSuccess = async (req, res) => {
  const { appointmentId, sessionId } = req.body;

  console.log("Received Session ID:", sessionId);

  try {
    if (!Array.isArray(appointmentId) || !sessionId) {
      return res.status(400).json({ message: "Invalid payment information" });
    }

    // Retrieve Session and Payment Intent
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paymentIntent = await stripe.paymentIntents.retrieve(
      session.payment_intent
    );

    if (!paymentIntent || paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        message: "Payment was not successful.",
        error: "Payment intent not found or not completed.",
      });
    }

    // Fetch appointment details
    const appointments = await appointmentModel
      .find({ _id: { $in: appointmentId } })
      .populate("docId userId centerId");
    console.log("a.B", appointments);

    if (!appointments.length) {
      return res
        .status(404)
        .json({ message: "No appointments found to update." });
    }

    // Update Appointment Status
    await appointmentModel.updateMany(
      { _id: { $in: appointmentId } },
      {
        $set: {
          payment: true,
          status: "booked",
          paymentIntentId: session.payment_intent,
        },
      }
    );

    // Fetch the updated appointments
    const updatedAppointments = await appointmentModel
      .find({ _id: { $in: appointmentId } })
      .populate("docId userId");

    // Send confirmation email to patient and doctor
    appointments.forEach(async (appointment) => {
      const patientEmail = appointment.userId.email;
      const doctorEmail = appointment.docId.email;
      const doctorName = appointment.docId.name;
      const patientName = appointment.userId.name;
      const appointmentDate = appointment.slotDate;
      const appointmentTime = appointment.slotTime;
      const diagnosticName = appointment.centerId.name;

      // Email for Patient
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: patientEmail,
        subject: "Appointment Booking",
        html: `<p>Dear ${patientName},</p>
               <p>Your payment was successful! Your appointment is booking with  ${doctorName} in ${diagnosticName}.</p>
               <p><b>Date:</b> ${appointmentDate} <br><b>Time:</b> ${appointmentTime}</p>
               <p>Thank you for using our service!</p>`,
      });

      // Email for Doctor
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: doctorEmail,
        subject: "New Appointment Confirmation",
        html: `<p>Dear Dr. ${doctorName},</p>
               <p>A new appointment has been confirmed.</p>
               <p><b>Patient Name:</b> ${patientName} <br><b>Date:</b> ${appointmentDate} <br><b>Time:</b> ${appointmentTime}</p>
               <p>Please check your dashboard for more details.</p>`,
      });
    });

    res.status(200).json({
      success: true,
      message: "Payment updated and confirmation emails sent successfully.",
      result: updatedAppointments, // Send the updated appointments
    });
  } catch (error) {
    console.error(
      "Error updating appointments or sending emails:",
      error.message
    );
    res.status(400).json({
      error: "Invalid payment details",
      details: error.message, // Send the specific error message here
    });
  }
};

exports.paymentHistory = async (req, res) => {
  const userId = req.user.id; // Assuming you're using JWT for authentication

  try {
    // Fetch payment details for all appointments of the logged-in user
    const appointments = await appointmentModel
      .find({ userId })
      .populate("docId", "name specialty address fees") // Populate doctor details
      .sort({ date: -1 });

    const paymentDetails = appointments.map((appointment) => ({
      ...appointment._doc,
      paymentStatus: appointment.payment?.status || "Pending",
      paymentInfo: appointment.payment || {},
    }));

    res.status(200).json({
      message: "Payment history fetched successfully",
      payments: paymentDetails,
    });
    console.log("API Response:", JSON.stringify(paymentDetails, null, 2));
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({ message: "Error fetching payment history" });
  }
};
