const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    internshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Internship",
      required: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    studentName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    cvFile: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["Pending", "Shortlisted", "Interview Scheduled", "Rejected"],
      default: "Pending"
    },
    skillMatchPercentage: {
      type: Number,
      default: 0
    },
    shortlistEmailSent: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);