const express = require("express");
const {
  addLeave,
  allLeave,
  updateLeaveStatus,
  getLeaveByEmployee,
} = require("../controllers/LeaveController");
const { authenticationRole } = require("../middlewares/authenticationRole");
const leaveRouter = express.Router();

leaveRouter.post("/add-Leave/", authenticationRole(["employee"]), addLeave);
leaveRouter.get(
  "/all-Leave/:centerId",
  authenticationRole(["diagnostic"]),
  allLeave
);
leaveRouter.patch(
  "/update-leave/:id",
  authenticationRole(["diagnostic"]),
  updateLeaveStatus
);
leaveRouter.get(
  "/employee-get-leaves/:employeeId",
  authenticationRole(["employee"]),
  getLeaveByEmployee
);

module.exports = leaveRouter;
