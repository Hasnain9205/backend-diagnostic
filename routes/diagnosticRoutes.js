const express = require("express");
const { authenticationRole } = require("../middlewares/authenticationRole");
const {
  doctorsForSpecificDiagnostic,
  testForSpecificDiagnostic,
  diagnosticDashboard,
  addDoctor,
  getTestAppointmentByCenter,
} = require("../controllers/diagnosticController");
const upload = require("../middlewares/multer");
const diagnosticRouter = express.Router();

diagnosticRouter.get(
  "/dashboard/:centerId",
  authenticationRole(["diagnostic"]),
  diagnosticDashboard
);

diagnosticRouter.get(
  "/diagnostic-doctors/:id/doctors",
  authenticationRole(["user"]),
  doctorsForSpecificDiagnostic
);

diagnosticRouter.get(
  "/getTestByCenter/:centerId/tests",
  authenticationRole(["diagnostic", "user"]),
  testForSpecificDiagnostic
);

diagnosticRouter.post(
  "/add-doctor",
  authenticationRole(["diagnostic"]),
  upload.single("image"),
  addDoctor
);

diagnosticRouter.get(
  "/getDoctorByCenter/:centerId/doctors",
  authenticationRole(["diagnostic"]),
  doctorsForSpecificDiagnostic
);
diagnosticRouter.get(
  "/test-appointments/:centerId",
  authenticationRole(["diagnostic"]),
  getTestAppointmentByCenter
);

module.exports = diagnosticRouter;
