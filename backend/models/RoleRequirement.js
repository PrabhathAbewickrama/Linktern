const mongoose = require("mongoose");

const roleRequirementSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      trim: true,
    },
    skill: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["required", "preferred"],
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index to ensure uniqueness of role-skill pairs
roleRequirementSchema.index({ role: 1, skill: 1 }, { unique: true });

module.exports = mongoose.model("RoleRequirement", roleRequirementSchema);
