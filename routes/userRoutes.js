const express = require("express");
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  bookAppointment,
  cancelAppointment,
  updateRole,
  getAppointment,
  getUsers,
  refreshToken,
} = require("../controllers/userController");
const { authenticationRole } = require("../middlewares/authenticationRole");
const upload = require("../middlewares/multer");
const {
  getAllDiagnostic,
  searchDiagnostic,
} = require("../controllers/diagnosticController");

const userRouter = express.Router();

userRouter.post("/register", upload.single("profileImage"), registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/refreshToken", refreshToken);
userRouter.get(
  "/profile",
  authenticationRole(["user", "admin", "doctor", "diagnostic"]),
  getUserProfile
);
userRouter.put(
  "/update-profile",
  authenticationRole(["user", "admin", "doctor"]),
  updateUserProfile
);
userRouter.post(
  "/book-appointment",
  authenticationRole(["user"]),
  bookAppointment
);
userRouter.get(
  "/appointments",
  authenticationRole(["user", "admin"]),
  getAppointment
);
userRouter.delete(
  "/appointments/:id",
  authenticationRole(["user"]),
  cancelAppointment
);
userRouter.put("/user-role/:userId", authenticationRole(["admin"]), updateRole);
userRouter.get("/all-users", authenticationRole(["admin"]), getUsers);
userRouter.get("/all-diagnostic", getAllDiagnostic);
userRouter.get(
  "/search-diagnostic",
  authenticationRole(["user"]),
  searchDiagnostic
);

module.exports = userRouter;
