const mongoose = require("mongoose");

const centerRevenueSchema = new mongoose.Schema(
  {
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Center",
      required: true,
    },
    month: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    netProfit: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

//  Prevent duplicate records for the same center & month/year
centerRevenueSchema.index({ centerId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("Revenue", centerRevenueSchema);
