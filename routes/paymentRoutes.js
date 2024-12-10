const express = require("express");
const {
  payment,
  paymentHistory,
  paymentSuccess,
} = require("../controllers/paymentController");
const { authenticationRole } = require("../middlewares/authenticationRole");

const paymentRouter = express.Router();

paymentRouter.post("/payments", payment);
paymentRouter.post("/success", paymentSuccess);
paymentRouter.get("/history", authenticationRole(["admin"]), paymentHistory);

module.exports = paymentRouter;
