const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    const mongoURI = `${process.env.MONGODB_URI}/DiagnosticDB`;
    mongoose.connection.on("connected", () => {
      console.log("MongoDB connected successfully");
    });
    mongoose.connection.on("error", (error) => {
      console.error("Error while connecting to MongoDB:", error);
    });
    await mongoose.connect(mongoURI);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
