const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const { execFile } = require("child_process");

dotenv.config();

const authRoutes = require("./routes/authRoutes");
const internshipRoutes = require("./routes/internshipRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const userRoutes = require("./routes/userRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const postRoutes = require("./routes/postRoutes");
const adminRoutes = require("./routes/adminRoutes");
const pdf = require("pdf-parse");
const Course = require("./models/Course");
const RoleRequirement = require("./models/RoleRequirement");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Existing project routes
app.use("/api/auth", authRoutes);
app.use("/api/internships", internshipRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/admin", adminRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Get available roles from DB
app.get("/api/roles", async (req, res) => {
  try {
    const roles = await RoleRequirement.find().distinct("role");
    res.json({ roles });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/chat", (req, res) => {
  const message = String(req.body?.message || "").trim();

  if (!message) {
    return res.status(400).json({
      error: "Please send a message.",
    });
  }

  const lowerMessage = message.toLowerCase();

  let reply =
    "Focus on building a strong CV, practicing interviews, improving core technical skills, and staying consistent with applications each week.";

  if (lowerMessage.includes("frontend")) {
    reply =
      "For a frontend internship, prioritize HTML, CSS, JavaScript, React, responsive design, Git, API integration, and a few polished portfolio projects.";
  } else if (
    lowerMessage.includes("behavioral") ||
    lowerMessage.includes("interview")
  ) {
    reply =
      "Prepare for behavioral interviews by practicing STAR answers, reviewing projects you have worked on, explaining challenges clearly, and preparing examples of teamwork, leadership, and problem-solving.";
  } else if (
    lowerMessage.includes("resume") ||
    lowerMessage.includes("cv")
  ) {
    reply =
      "Keep your resume to one page, highlight measurable impact, list relevant skills clearly, and tailor your projects and experience to the internship role you want.";
  } else if (
    lowerMessage.includes("30-day") ||
    lowerMessage.includes("job-ready") ||
    lowerMessage.includes("plan")
  ) {
    reply =
      "A good 30-day plan is: week 1 strengthen fundamentals, week 2 build one portfolio project, week 3 practice interviews and improve your CV, week 4 apply consistently and refine based on feedback.";
  } else if (
    lowerMessage.includes("backend") ||
    lowerMessage.includes("api")
  ) {
    reply =
      "For backend roles, strengthen Node.js, Express, REST APIs, databases, authentication, error handling, and deployment basics. Build at least one complete API project.";
  } else if (
    lowerMessage.includes("skill") ||
    lowerMessage.includes("learn")
  ) {
    reply =
      "Choose one target role, identify its core tools and concepts, practice them through small projects, and document what you learn so you can discuss it confidently in interviews.";
  } else if (
    lowerMessage.includes("application") ||
    lowerMessage.includes("apply")
  ) {
    reply =
      "Apply consistently to relevant internships, customize your resume for each role, write short clear introductions, and track applications so you can follow up effectively.";
  }

  return res.json({ reply });
});

// Skill gap analyzer route
app.post("/api/skill-gap-ai", upload.single("cv"), async (req, res) => {
  try {
    const { targetRole } = req.body;
    const file = req.file;

    if (!targetRole) {
      return res.status(400).json({
        success: false,
        error: "Please provide a target role.",
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        error: "Please upload a valid PDF CV.",
      });
    }

    if (file.mimetype !== "application/pdf") {
      return res.status(400).json({
        success: false,
        error: "Uploaded file must be a PDF.",
      });
    }

    if (!file.buffer) {
      return res.status(400).json({
        success: false,
        error: "File buffer missing.",
      });
    }

    // Fetch requirements from DB instead of hardcoded map
    const requirements = await RoleRequirement.find({ role: targetRole });
    
    if (requirements.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No requirements found for role: ${targetRole}. Please contact an administrator.`
      });
    }

    const requiredSkills = requirements
      .filter(r => r.type === "required")
      .map(r => r.skill);
    
    const preferredSkills = requirements
      .filter(r => r.type === "preferred")
      .map(r => r.skill);

    const allRoleSkills = requirements.map(r => r.skill);

    const data = await pdf(file.buffer);
    const text = (data.text || "").toLowerCase();

    // Student skills matching all known skills in the system (for profile building)
    const allKnownRequirements = await RoleRequirement.find().distinct("skill");
    
    const studentSkills = allKnownRequirements.filter((skill) =>
      text.includes(skill.toLowerCase()),
    );


    const normalizedStudentSkills = studentSkills.map((skill) =>
      skill.trim().toLowerCase(),
    );

    const missingSkills = requiredSkills.filter(
      (skill) => !normalizedStudentSkills.includes(skill.toLowerCase()),
    );

    const matchedSkills = requiredSkills.filter((skill) =>
      normalizedStudentSkills.includes(skill.toLowerCase()),
    );

    let score = 0;
    if (requiredSkills.length > 0) {
      score = Math.round((matchedSkills.length / requiredSkills.length) * 100);
    }

    let level = "Low";
    if (score >= 75) level = "High";
    else if (score >= 40) level = "Medium";

    return res.json({
      success: true,
      targetRole,
      requiredSkills,
      currentSkills: studentSkills,
      matchedSkills,
      missingSkills,
      score,
      level,
      recommendations: missingSkills.map(
        (skill) => `Improve your knowledge in ${skill}`,
      ),
    });
  } catch (err) {
    console.error("FULL PDF ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to read CV document.",
      debug: err.message,
    });
  }
});

// Course recommendations route
app.post("/api/course-recommendations", async (req, res) => {
  const { missingSkills, difficulty } = req.body;

  if (!missingSkills || !Array.isArray(missingSkills)) {
    return res.status(400).json({
      success: false,
      error: "Missing or invalid missingSkills array.",
    });
  }

  if (
    !difficulty ||
    !["low", "medium", "high"].includes(difficulty.toLowerCase())
  ) {
    return res.status(400).json({
      success: false,
      error: "Difficulty must be one of: low, medium, high.",
    });
  }

  try {
    const courses = await Course.find();
    const pythonCommand = process.platform === "win32" ? "py" : "python3";
    const scriptPath = path.join(__dirname, "services", "course_recommender.py");
    const args = [scriptPath, JSON.stringify(missingSkills), difficulty, JSON.stringify(courses)];

    execFile(pythonCommand, args, { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error("Error executing ML script:", error.message);
        console.error(stderr);
        return res.status(500).json({
          success: false,
          error: "Internal server error during recommendation.",
        });
      }

      try {
        const output = JSON.parse(stdout);

        if (output.error) {
          return res.status(500).json({
            success: false,
            error: output.error,
          });
        }

        return res.json({
          success: true,
          ...output,
        });
      } catch (parseError) {
        console.error("Failed to parse ML script output:", stdout);
        return res.status(500).json({
          success: false,
          error: "Invalid ML output model.",
        });
      }
    });
  } catch (dbError) {
    console.error("DB Error fetching courses:", dbError.message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch courses from database.",
    });
  }
});

// MongoDB connection
mongoose
  .connect(
    process.env.MONGODB_URI ||
      "mongodb+srv://linkternuser:admin123@cluster0.zpxkatc.mongodb.net/internship_portal?retryWrites=true&w=majority&appName=Cluster0",
  )
  .then(() => {
    console.log("MongoDB connected");

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use. Stop the existing backend process before starting a new one.`,
        );
      } else {
        console.error("Server startup error:", error.message);
      }
      process.exit(1);
    });
  })
  .catch((err) => {
    console.log("DB Error:", err.message);
  });
