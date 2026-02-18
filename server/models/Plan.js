const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    name: String,
    year: Number,

    layout: Object,
    plantings: Object,

    schemaVersion: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Plan", planSchema);
