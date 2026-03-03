const mongoose = require("mongoose");

const seasonPlanSchema = new mongoose.Schema(
  {
    gardenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Garden",
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    layout: {
      type: Object,
      default: {},
    },
    currentVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Version",
    },
  },
  { timestamps: true },
);

// Compound unique index: one plan per garden per year
seasonPlanSchema.index({ gardenId: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("SeasonPlan", seasonPlanSchema);
