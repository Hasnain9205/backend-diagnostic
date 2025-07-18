const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/mongodb");
const connectCloudinary = require("./config/cloudinary");
const adminRouter = require("./routes/adminROutes");
const doctorRouter = require("./routes/doctorRoutes");
const testRouter = require("./routes/testRoutes");
const paymentRouter = require("./routes/paymentRoutes");
const invoiceRouter = require("./routes/invoiceRoutes");
const userRouter = require("./routes/userRoutes");
const diagnosticRouter = require("./routes/diagnosticRoutes");
const prescriptionRouter = require("./routes/prescriptionRoutes");
const employeeRouter = require("./routes/employeeRoutes");
const leaveRouter = require("./routes/leaveRouter");

const app = express();

const port = process.env.PORT || 5001;

// Connect to database and cloud services
connectDB();
connectCloudinary();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin: [
    "https://astounding-malabi-42d150.netlify.app",
    "http://localhost:5173",
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));

// API endpoints
app.use("/api/admin", adminRouter);
app.use("/api/users", userRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/tests", testRouter);
app.use("/api/diagnostic", diagnosticRouter);
app.use("/api/invoice", invoiceRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/prescriptions", prescriptionRouter);
app.use("/api/employee", employeeRouter);
app.use("/api/leave", leaveRouter);

// Test route
app.get("/", (req, res) => {
  res.send("API working!");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Start server
app.listen(port, () => {
  console.log("Server started on port", port);
});
