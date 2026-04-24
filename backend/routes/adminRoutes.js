const express = require("express");
const Course = require("../models/Course");
const RoleRequirement = require("../models/RoleRequirement");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { syncRoleRequirementsCSV } = require("../utils/csvHelper");

const router = express.Router();

// Get all courses
router.get("/courses", async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new course
router.post("/courses", protect, adminOnly, async (req, res) => {
  try {
    const { course_name, skills_covered, difficulty, link } = req.body;

    if (!course_name || !skills_covered || !difficulty || !link) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const course = await Course.create({
      course_name,
      skills_covered,
      difficulty,
      link,
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a course
router.put("/courses/:id", protect, adminOnly, async (req, res) => {
  try {
    const { course_name, skills_covered, difficulty, link } = req.body;

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    course.course_name = course_name || course.course_name;
    course.skills_covered = skills_covered || course.skills_covered;
    course.difficulty = difficulty || course.difficulty;
    course.link = link || course.link;

    await course.save();

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a course
router.delete("/courses/:id", protect, adminOnly, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    await course.deleteOne();

    res.json({ message: "Course removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- Role Requirement Management ---

// Get all role requirements
router.get("/role-requirements", protect, adminOnly, async (req, res) => {
  try {
    const requirements = await RoleRequirement.find().sort({ role: 1, type: -1 });
    res.json(requirements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new role requirement
router.post("/role-requirements", protect, adminOnly, async (req, res) => {
  try {
    const { role, skill, type } = req.body;

    if (!role || !skill || !type) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const requirement = await RoleRequirement.create({
      role,
      skill,
      type,
    });

    await syncRoleRequirementsCSV();

    res.status(201).json(requirement);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "This role-skill combination already exists" });
    }
    res.status(500).json({ message: error.message });
  }
});

// Update a role requirement
router.put("/role-requirements/:id", protect, adminOnly, async (req, res) => {
  try {
    const { role, skill, type } = req.body;

    const requirement = await RoleRequirement.findById(req.params.id);

    if (!requirement) {
      return res.status(404).json({ message: "Role requirement not found" });
    }

    requirement.role = role || requirement.role;
    requirement.skill = skill || requirement.skill;
    requirement.type = type || requirement.type;

    await requirement.save();
    await syncRoleRequirementsCSV();

    res.json(requirement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a role requirement
router.delete("/role-requirements/:id", protect, adminOnly, async (req, res) => {
  try {
    const requirement = await RoleRequirement.findById(req.params.id);

    if (!requirement) {
      return res.status(404).json({ message: "Role requirement not found" });
    }

    await requirement.deleteOne();
    await syncRoleRequirementsCSV();

    res.json({ message: "Role requirement removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

