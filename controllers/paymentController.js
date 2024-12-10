const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const appointmentModel = require("../models/appointmentModel");

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

    // Update Appointment Status
    const result = await appointmentModel.updateMany(
      { _id: { $in: appointmentId } },
      {
        $set: {
          payment: true,
          status: "booked",
          paymentIntentId: session.payment_intent,
        },
      },
      { multi: true }
    );

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ message: "No appointments found to update." });
    }

    res.status(200).json({
      success: true,
      message: "Payment updated successfully.",
      result,
    });
  } catch (error) {
    console.error("Error updating appointments:", error.message);
    res.status(500).json({
      error: "Failed to update appointments.",
      details: error.message,
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
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({ message: "Error fetching payment history" });
  }
};
