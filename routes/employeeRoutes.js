const express = require("express");
const { authenticationRole } = require("../middlewares/authenticationRole");
const {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getAllEmployeesByCenterId,
  giveSalary,
  getSalarySheet,
  dueSalary,
  employeeDashboard,
} = require("../controllers/employeeController");
const upload = require("../middlewares/multer");

const employeeRouter = express.Router();

employeeRouter.post(
  "/create-employee",
  authenticationRole(["diagnostic"]),
  upload.single("image"),
  createEmployee
);
employeeRouter.get("/employees", getAllEmployees);
employeeRouter.get(
  "/get-employee",
  authenticationRole(["diagnostic"]),
  getAllEmployeesByCenterId
);
employeeRouter.get(
  "/get-employee-by-id/:id",
  authenticationRole(["diagnostic"]),
  getEmployeeById
);
employeeRouter.put(
  "/update-employee/:id",
  authenticationRole(["diagnostic"]),
  updateEmployee
);
employeeRouter.delete(
  "/delete-employee/:id",
  authenticationRole(["diagnostic"]),
  deleteEmployee
);
employeeRouter.post(
  "/give-salary",
  authenticationRole(["diagnostic"]),
  giveSalary
);
employeeRouter.get("/check-due", authenticationRole(["diagnostic"]), dueSalary);
employeeRouter.get(
  "/salary-sheet",
  authenticationRole(["diagnostic"]),
  getSalarySheet
);
employeeRouter.get(
  "/employee-dashboard/:employeeId",
  authenticationRole(["employee"]),
  employeeDashboard
);

module.exports = employeeRouter;
