const express = require("express");
const { authenticationRole } = require("../middlewares/authenticationRole");
const {
  createPrescription,
  allPrescription,
  prescriptionById,
  deletePrescription,
  updatePrescription,
  userPrescription,
} = require("../controllers/prescriptionController");

prescriptionRouter = express.Router();

prescriptionRouter.post(
  "/create",
  authenticationRole(["doctor"]),
  createPrescription
);
prescriptionRouter.get(
  "/get-all-prescription",
  authenticationRole(["diagnostic", "doctor"]),
  allPrescription
);
prescriptionRouter.get(
  "/get-user-prescription",
  authenticationRole(["user"]),
  userPrescription
);
prescriptionRouter.get(
  "/get-prescription-by-id/:id",
  authenticationRole(["user", "doctor"]),
  prescriptionById
);
prescriptionRouter.delete(
  "/delete-prescription/:id",
  authenticationRole(["doctor"]),
  deletePrescription
);
prescriptionRouter.put(
  "/update-prescription/:id",
  authenticationRole(["user", "doctor"]),
  updatePrescription
);

module.exports = prescriptionRouter;
