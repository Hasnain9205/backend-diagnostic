const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

const authenticationRole = (roles) => {
  return async (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    try {
      // Verify the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user in the database by ID
      const user = await userModel.findById(decoded.id);

      // If no user is found, return an error
      if (!user) {
        return res
          .status(401)
          .json({ message: "Invalid token. User not found." });
      }

      // Attach user details to the request object
      req.user = user;

      // Check if the user's role is allowed to access this route
      if (!roles.includes(user.role)) {
        return res.status(403).json({
          message:
            "Access denied. You do not have permission to access this resource.",
        });
      }

      next();
    } catch (error) {
      // Handle token errors
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Token has expired. Please log in again." });
      }
      return res.status(400).json({ message: "Invalid token error." });
    }
  };
};

module.exports = { authenticationRole };
