const express = require("express");
const { authenticationRole } = require("../middlewares/authenticationRole");
const {
  createTest,
  getAllTest,
  updateTest,
  getTestById,
  bookTest,
  cancelTest,
  getTestAppointment,
  payment,
  paymentSuccess,
  paymentHistory,
  updateTestAppointmentStatus,
  downloadInvoice,
  getInvoice,
  deleteTest,
} = require("../controllers/testController");
const upload = require("../middlewares/multer");

const testRouter = express.Router();

testRouter.post(
  "/create-test",
  authenticationRole(["admin"]),
  upload.single("image"),
  createTest
);
testRouter.get("/get-all-test", getAllTest);
testRouter.get(
  "/test-by-id/:testId",
  authenticationRole(["user", "admin"]),
  getTestById
);
testRouter.post("/book-test", authenticationRole(["user"]), bookTest);
testRouter.get(
  "/get-test-appointment",
  authenticationRole(["user", "admin"]),
  getTestAppointment
);
testRouter.patch(
  "/update-appointment-status/:id",
  authenticationRole(["admin"]),
  updateTestAppointmentStatus
);
testRouter.put("/update-test/:id", authenticationRole(["admin"]), updateTest);
testRouter.delete(
  "/delete-test/:id",
  authenticationRole(["admin"]),
  deleteTest
);
testRouter.post("/cancel/:id", authenticationRole(["user"]), cancelTest);
testRouter.post(
  "/create-payment-intent",
  authenticationRole(["user"]),
  payment
);

testRouter.post("/history", authenticationRole(["admin"]), paymentHistory);

testRouter.post(
  "/payment-success",
  authenticationRole(["user"]),
  paymentSuccess
);

testRouter.get(
  "/download-invoice/:appointmentId",
  authenticationRole(["user"]),
  downloadInvoice
);
testRouter.get("/invoices", authenticationRole(["user", "admin"]), getInvoice);

module.exports = testRouter;
