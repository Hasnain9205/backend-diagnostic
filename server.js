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

const app = express();
const port = process.env.PORT || 5001;

// Connect to database and cloud services
connectDB();
connectCloudinary();

app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://animated-seahorse-9f26f7.netlify.app",
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
app.use("/api/invoice", invoiceRouter);
app.use("/api/payment", paymentRouter);

// Test route
app.get("/", (req, res) => {
  res.send("API working!");
});

// Start server
app.listen(port, () => {
  console.log("Server started on port", port);
});
