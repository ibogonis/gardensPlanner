const mongoose = require("mongoose");

const versionSchema = new mongoose.Schema(
  {
    seasonPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SeasonPlan",
      required: true,
    },
    // Full snapshot versioning: both layout and plantings stored here
    layout: {
      type: Object,
      required: true,
      default: {},
    },
    plantings: {
      type: Object,
      default: {},
    },
    comment: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["manual", "auto", "migration"],
      default: "manual",
    },
  },
  { timestamps: true },
);

// Index for efficient queries
versionSchema.index({ seasonPlanId: 1, createdAt: -1 });

module.exports = mongoose.model("Version", versionSchema);
