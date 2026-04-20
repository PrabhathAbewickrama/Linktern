import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { createRequire } from "module";
import { exec } from "child_process";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

dotenv.config();

const upload = multer({ storage: multer.memoryStorage() });

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Backend working");
});

// Get available roles
app.get("/api/roles", (req, res) => {
  res.json({
    roles: [
      "Frontend Developer",
      "Backend Developer",
      "Full Stack Developer",
      "QA Engineer",
      "UI/UX Designer",
      "Data Analyst",
      "Machine Learning Engineer"
    ]
  });
});

// Skill gap analyzer route
app.post("/api/skill-gap-ai", upload.single('cv'), async (req, res) => {
  const { targetRole } = req.body;
  const file = req.file;

  const roleSkillsMap = {
    "Frontend Developer": [
      "HTML",
      "CSS",
      "JavaScript",
      "React",
      "Git",
      "Responsive Design"
    ],
    "Backend Developer": [
      "Node.js",
      "Express.js",
      "MongoDB",
      "REST API",
      "JWT",
      "Git"
    ],
    "Full Stack Developer": [
      "HTML",
      "CSS",
      "JavaScript",
      "React",
      "Node.js",
      "Express.js",
      "MongoDB",
      "REST API",
      "Git"
    ],
    "QA Engineer": [
      "Manual Testing",
      "Test Cases",
      "Bug Reporting",
      "Selenium",
      "Postman",
      "SQL"
    ],
    "UI/UX Designer": [
      "Figma",
      "Wireframing",
      "Prototyping",
      "User Research",
      "Typography",
      "Color Theory"
    ],
    "Data Analyst": [
      "Excel",
      "SQL",
      "Python",
      "Power BI",
      "Statistics",
      "Data Visualization"
    ],
    "Machine Learning Engineer": [
      "Python",
      "NumPy",
      "Pandas",
      "Scikit-learn",
      "Machine Learning",
      "Data Preprocessing"
    ]
  };

  const requiredSkills = roleSkillsMap[targetRole] || [];
  
  let studentSkills = [];
  if (!targetRole) {
    return res.status(400).json({ success: false, error: "Please provide a target role." });
  }

  if (!file) {
    return res.status(400).json({ success: false, error: "Please upload a valid PDF CV." });
  }

  if (file.mimetype !== 'application/pdf') {
    return res.status(400).json({ success: false, error: "Uploaded file must be a PDF." });
  }

  try {
    const data = await pdfParse(file.buffer);
    const text = data.text.toLowerCase();
    
    // Flatten all known skills from the map to use as a dictionary
    const allKnownSkills = [...new Set(Object.values(roleSkillsMap).flat())];
    
    studentSkills = allKnownSkills.filter(skill => text.includes(skill.toLowerCase()));
  } catch (err) {
    console.error("Error parsing PDF:", err);
    return res.status(500).json({ success: false, error: "Failed to read CV document." });
  }

  const normalizedStudentSkills = studentSkills.map((skill) =>
    skill.trim().toLowerCase()
  );

  const missingSkills = requiredSkills.filter(
    (skill) => !normalizedStudentSkills.includes(skill.toLowerCase())
  );

  const matchedSkills = requiredSkills.filter((skill) =>
    normalizedStudentSkills.includes(skill.toLowerCase())
  );

  let score = 0;
  if (requiredSkills.length > 0) {
    score = Math.round((matchedSkills.length / requiredSkills.length) * 100);
  }

  let level = "Low";
  if (score >= 75) level = "High";
  else if (score >= 40) level = "Medium";

  res.json({
    success: true,
    targetRole,
    requiredSkills,
    currentSkills: studentSkills,
    matchedSkills,
    missingSkills,
    score,
    level,
    recommendations: missingSkills.map(
      (skill) => `Improve your knowledge in ${skill}`
    )
  });
});



// Course recommendations route
app.post("/api/course-recommendations", (req, res) => {
  const { missingSkills, difficulty } = req.body;

  if (!missingSkills || !Array.isArray(missingSkills)) {
    return res.status(400).json({ success: false, error: "Missing or invalid missingSkills array." });
  }

  if (!difficulty || !["low", "medium", "high"].includes(difficulty.toLowerCase())) {
    return res.status(400).json({ success: false, error: "Difficulty must be one of: low, medium, high." });
  }

  const missingSkillsStr = JSON.stringify(missingSkills).replace(/"/g, '\\"');
  const command = `python services/course_recommender.py "${missingSkillsStr}" "${difficulty}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing ML script: ${error.message}`);
      return res.status(500).json({ success: false, error: "Internal server error during recommendation." });
    }

    try {
      const output = JSON.parse(stdout);
      if (output.error) {
         return res.status(500).json({ success: false, error: output.error });
      }
      res.json({ success: true, ...output });
    } catch (parseError) {
      console.error("Failed to parse ML script output:", stdout);
      return res.status(500).json({ success: false, error: "Invalid ML output model." });
    }
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});