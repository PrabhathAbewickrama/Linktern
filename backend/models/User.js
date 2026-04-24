const mongoose = require("mongoose");

const companyReviewSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studentName: {
      type: String,
      default: "",
    },
    studentUsername: {
      type: String,
      default: "",
    },
    studentProfilePicture: {
      type: String,
      default: "",
    },
    companyName: {
      type: String,
      default: "",
    },
    internshipTitle: {
      type: String,
      default: "",
    },
    workMode: {
      type: String,
      default: "",
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    durationLabel: {
      type: String,
      default: "",
    },
    stipend: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    pros: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1200,
    },
    cons: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1200,
    },
    recommendations: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1200,
    },
  },
  { timestamps: true },
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "company", "admin"],
      required: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: function () {
        return this.role !== "student";
      },
    },
    emailVerificationCode: {
      type: String,
      default: "",
    },
    emailVerificationExpiresAt: {
      type: Date,
      default: null,
    },
    studentId: {
      type: String,
      default: "",
    },
    companyName: {
      type: String,
      default: "",
    },
    profilePicture: {
      type: String,
      default: "",
    },
    // Additional student fields for CV filtering
    university: {
      type: String,
      default: "",
    },
    degree: {
      type: String,
      default: "",
    },
    gpa: {
      type: Number,
      default: 0,
    },
    skills: [
      {
        type: String,
      },
    ],
    cvUrl: {
      type: String,
      default: "",
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    reviews: [companyReviewSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
