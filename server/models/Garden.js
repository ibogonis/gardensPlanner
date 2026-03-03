const mongoose = require("mongoose");

const gardenSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["owner", "editor", "viewer"],
          default: "owner",
        },
      },
    ],
  },
  { timestamps: true },
);

// Compound index for efficient queries
gardenSchema.index({ "members.userId": 1 });
gardenSchema.index({ title: 1, "members.userId": 1 });

module.exports = mongoose.model("Garden", gardenSchema);
