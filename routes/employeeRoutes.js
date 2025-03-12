const express = require("express");
const { authenticationRole } = require("../middlewares/authenticationRole");
const { createEmployee } = require("../controllers/employeeController");
const upload = require("../middlewares/multer");

const employeeRouter = express.Router();

employeeRouter.post(
  "/create-employee",
  authenticationRole(["diagnostic"]),
  upload.single("image"),
  createEmployee
);

module.exports = employeeRouter;
