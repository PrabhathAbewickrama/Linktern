import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

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
app.post("/api/skill-gap-ai", (req, res) => {
  const { currentSkills, targetRole } = req.body;

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
  const studentSkills = Array.isArray(currentSkills) ? currentSkills : [];

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

/*
// Demand prediction route
app.post("/api/predict-demand-ai", (req, res) => {
  const { targetRole } = req.body;

  const demandMap = {
    "Frontend Developer": {
      predictedDemand: "High",
      reason: "Modern web applications need frontend developers."
    },
    "Backend Developer": {
      predictedDemand: "High",
      reason: "Backend systems and APIs are always in demand."
    },
    "Full Stack Developer": {
      predictedDemand: "Very High",
      reason: "Full stack developers can handle both frontend and backend."
    },
    "QA Engineer": {
      predictedDemand: "Medium",
      reason: "Quality assurance remains important in software teams."
    },
    "UI/UX Designer": {
      predictedDemand: "High",
      reason: "User-friendly product design is very valuable."
    },
    "Data Analyst": {
      predictedDemand: "High",
      reason: "Businesses depend on data-driven decisions."
    },
    "Machine Learning Engineer": {
      predictedDemand: "Very High",
      reason: "AI and machine learning jobs are rapidly growing."
    }
  };

  const result = demandMap[targetRole] || {
    predictedDemand: "Medium",
    reason: "This role has moderate market demand."
  };

  res.json({
    success: true,
    targetRole,
    predictedDemand: result.predictedDemand,
    reason: result.reason,
    suggestions: [
      "Build practical projects",
      "Improve your portfolio",
      "Practice interview questions",
      "Learn current industry tools"
    ]
  });
});

*/

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});