const mongoose = require("mongoose");

const internshipSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    companyName: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ["Remote", "On-site", "Hybrid"],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    skills: [
      {
        type: String
      }
    ],
    deadline: {
      type: Date,
      required: true
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    // CV filtering fields
    requiredSkills: [{
      type: String
    }],
    requiredDegree: {
      type: String,
      default: ""
    },
    minGpa: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Internship", internshipSchema);