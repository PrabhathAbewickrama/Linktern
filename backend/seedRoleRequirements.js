const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const RoleRequirement = require("./models/RoleRequirement");
const dotenv = require("dotenv");

dotenv.config();

const seedRoleRequirements = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb+srv://linkternuser:admin123@cluster0.zpxkatc.mongodb.net/internship_portal?retryWrites=true&w=majority&appName=Cluster0"
    );

    console.log("MongoDB connected for seeding Role Requirements");

    const csvPath = path.join(__dirname, "data", "role_requirements.csv");
    if (!fs.existsSync(csvPath)) {
      console.error("CSV file not found");
      process.exit(1);
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.split("\n").filter((line) => line.trim() !== "");
    const headers = lines[0].split(",");

    const requirements = [];
    const seen = new Set();

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      const entry = {};
      headers.forEach((header, index) => {
        let val = values[index]?.trim().replace(/^"|"$/g, "");
        if (header.trim() === "role") entry.role = val;
        if (header.trim() === "skill") entry.skill = val;
        if (header.trim() === "type") entry.type = val;
      });

      if (entry.role && entry.skill && entry.type) {
        const key = `${entry.role.toLowerCase()}|${entry.skill.toLowerCase()}`;
        if (!seen.has(key)) {
          requirements.push(entry);
          seen.add(key);
        }
      }
    }

    await RoleRequirement.deleteMany({});
    await RoleRequirement.insertMany(requirements);

    console.log(`Database seeded successfully with ${requirements.length} entries!`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error.message);
    process.exit(1);
  }
};

seedRoleRequirements();
