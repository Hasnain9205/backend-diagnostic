const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not defined in the environment variables.");
    process.exit(1);
  }

  try {
    const mongoURI = `${process.env.MONGODB_URI}/DiagnosticDB`;

    mongoose.connection.on("connected", () => {
      console.log("MongoDB connected successfully");
    });

    mongoose.connection.on("error", (error) => {
      console.error("MongoDB connection error:", error.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected successfully.");
    });

    await mongoose.connect(mongoURI);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
