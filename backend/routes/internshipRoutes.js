const express = require("express");
const router = express.Router();
const Internship = require("../models/Internship");
const { protect, companyOnly } = require("../middleware/authMiddleware");
const { updateRoleRequirements } = require("../utils/csvHelper");

// CREATE internship - only company
router.post("/", protect, companyOnly, async (req, res) => {
  try {
    const {
      title,
      location,
      type,
      description,
      skills,
      deadline,
      requiredSkills
    } = req.body;

    if (!title || !location || !type || !description || !deadline) {
      return res.status(400).json({
        message: "Please fill all required fields"
      });
    }

    const internship = await Internship.create({
      title,
      companyName: req.user.companyName,
      location,
      type,
      description,
      skills: skills || [],
      requiredSkills: requiredSkills || [],
      deadline,
      postedBy: req.user.id
    });

    res.status(201).json({
      message: "Internship created successfully",
      internship
    });

    // Automatically update role requirements CSV
    updateRoleRequirements(title, skills, requiredSkills);
  } catch (error) {
    console.log("Create internship error:", error);
    res.status(500).json({ message: error.message });
  }
});

// GET all internships - public
router.get("/", async (req, res) => {
  try {
    const {
      keyword = "",
      location = "",
      type = "",
      sort = "latest"
    } = req.query;

    let filter = {};

    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { companyName: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
        { skills: { $regex: keyword, $options: "i" } }
      ];
    }

    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    if (type) {
      filter.type = type;
    }

    let sortOption = { createdAt: -1 };

    if (sort === "deadline") {
      sortOption = { deadline: 1 };
    }

    const internships = await Internship.find(filter).sort(sortOption);

    res.json(internships);
  } catch (error) {
    console.log("Get internships error:", error);
    res.status(500).json({ message: error.message });
  }
});

// GET logged-in company's internships
router.get("/my-internships", protect, companyOnly, async (req, res) => {
  try {
    const internships = await Internship.find({ postedBy: req.user.id }).sort({
      createdAt: -1
    });

    res.json(internships);
  } catch (error) {
    console.log("Get my internships error:", error);
    res.status(500).json({ message: error.message });
  }
});

// GET single internship - public
router.get("/:id", async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);

    if (!internship) {
      return res.status(404).json({ message: "Internship not found" });
    }

    res.json(internship);
  } catch (error) {
    console.log("Get single internship error:", error);
    res.status(500).json({ message: error.message });
  }
});

// UPDATE internship - only owner company
router.put("/:id", protect, companyOnly, async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);

    if (!internship) {
      return res.status(404).json({ message: "Internship not found" });
    }

    if (internship.postedBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You can only update your own internships"
      });
    }

    const {
      title,
      location,
      type,
      description,
      skills,
      deadline
    } = req.body;

    internship.title = title || internship.title;
    internship.location = location || internship.location;
    internship.type = type || internship.type;
    internship.description = description || internship.description;
    internship.skills = skills || internship.skills;
    internship.deadline = deadline || internship.deadline;

    const updatedInternship = await internship.save();

    res.json({
      message: "Internship updated successfully",
      internship: updatedInternship
    });
  } catch (error) {
    console.log("Update internship error:", error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE internship - only owner company
router.delete("/:id", protect, companyOnly, async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);

    if (!internship) {
      return res.status(404).json({ message: "Internship not found" });
    }

    if (internship.postedBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You can only delete your own internships"
      });
    }

    await internship.deleteOne();

    res.json({ message: "Internship deleted successfully" });
  } catch (error) {
    console.log("Delete internship error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;