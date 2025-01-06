const express = require("express");
const upload = require("../middlewares/multer");
const {
  addDoctor,
  allDoctor,
  appointmentsAdmin,
  appointmentCancelAdmin,
  adminDashboard,
  updateDoctor,
  deleteDoctor,
  getDoctor,
  getTestAppointment,
} = require("../controllers/adminController");
const { authenticationRole } = require("../middlewares/authenticationRole");
const {
  addDiagnostic,
  getDiagnosticById,
  updateDiagnostic,
  deleteDiagnostic,
} = require("../controllers/diagnosticController");

const adminRouter = express.Router();

adminRouter.post(
  "/add-doctor",
  authenticationRole(["admin"]),
  upload.single("image"),
  addDoctor
);

adminRouter.get("/doctors", authenticationRole(["admin"]), allDoctor);
adminRouter.get("/doctor/:id", authenticationRole(["admin"]), getDoctor);
adminRouter.put(
  "/update-doctor/:id",
  authenticationRole(["admin", "diagnostic"]),
  updateDoctor
);
adminRouter.get(
  "/get-testAppointments",
  authenticationRole(["user", "admin", "diagnostic"]),
  getTestAppointment
);
adminRouter.delete(
  "/delete-doctor/:doctorId",
  authenticationRole(["admin", "diagnostic"]),
  deleteDoctor
);
adminRouter.get(
  "/all-appointment/:centerId",
  authenticationRole(["admin", "diagnostic"]),
  appointmentsAdmin
);
adminRouter.post(
  "/cancel-appointment",
  authenticationRole(["admin", "diagnostic"]),
  appointmentCancelAdmin
);
adminRouter.get("/dashboard", authenticationRole(["admin"]), adminDashboard);
adminRouter.post(
  "/add-diagnostic",
  authenticationRole(["admin"]),
  upload.single("image"),
  addDiagnostic
);
adminRouter.get(
  "/diagnostic-by-id/:id",
  authenticationRole(["user", "admin"]),
  getDiagnosticById
);
adminRouter.put(
  "/update-diagnostic/:id",
  authenticationRole(["admin"]),
  updateDiagnostic
);
adminRouter.delete(
  "/delete-diagnostic/:id",
  authenticationRole(["admin"]),
  deleteDiagnostic
);
module.exports = adminRouter;
