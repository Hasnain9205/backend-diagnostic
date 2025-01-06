const express = require("express");
const {
  doctorList,
  doctorAppointment,
  appointmentCancel,
  appointmentComplete,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
  doctorDetails,
  uniquePatients,
  filterDoctor,
} = require("../controllers/doctorController");
const { authenticationRole } = require("../middlewares/authenticationRole");

const doctorRouter = express.Router();

doctorRouter.get("/doctor-details/:id", doctorDetails);
doctorRouter.get("/doctors-list", doctorList);
doctorRouter.get("/filter-doctor", authenticationRole(["user"]), filterDoctor);
doctorRouter.get("/unique-patients", uniquePatients);
doctorRouter.get(
  "/appointment-doctor",
  authenticationRole(["doctor"]),
  doctorAppointment
);
doctorRouter.patch(
  "/complete-appointment",
  authenticationRole(["doctor"]),
  appointmentComplete
);
doctorRouter.patch(
  "/cancel-appointment",
  authenticationRole(["doctor", "admin"]),
  appointmentCancel
);
doctorRouter.get(
  "/dashboard",
  authenticationRole(["doctor", "admin"]),
  doctorDashboard
);
doctorRouter.get("/profile", authenticationRole(["doctor"]), doctorProfile);
doctorRouter.post(
  "/update-profile",
  authenticationRole(["doctor"]),
  updateDoctorProfile
);

module.exports = doctorRouter;
