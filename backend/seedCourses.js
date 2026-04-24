const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Course = require("./models/Course");
const dotenv = require("dotenv");

dotenv.config();

const seedCourses = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb+srv://linkternuser:admin123@cluster0.zpxkatc.mongodb.net/internship_portal?retryWrites=true&w=majority&appName=Cluster0"
    );

    console.log("MongoDB connected for seeding");

    const csvPath = path.join(__dirname, "data", "courses.csv");
    if (!fs.existsSync(csvPath)) {
      console.error("CSV file not found");
      process.exit(1);
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.split("\n").filter((line) => line.trim() !== "");
    const headers = lines[0].split(",");

    const courses = lines.slice(1).map((line) => {
      // Handle commas within quotes if any, though here it's simple
      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      const course = {};
      headers.forEach((header, index) => {
        let val = values[index]?.trim().replace(/^"|"$/g, "");
        if (header.trim() === "course_name") course.course_name = val;
        if (header.trim() === "skills_covered") course.skills_covered = val;
        if (header.trim() === "difficulty") course.difficulty = val;
        if (header.trim() === "link") course.link = val;
      });
      return course;
    });

    await Course.deleteMany({});
    await Course.insertMany(courses);

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error.message);
    process.exit(1);
  }
};

seedCourses();
