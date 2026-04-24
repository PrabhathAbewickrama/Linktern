const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    course_name: {
      type: String,
      required: true,
      trim: true,
    },
    skills_covered: {
      type: String,
      required: true,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ["Low", "Medium", "High"],
      required: true,
    },
    link: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
