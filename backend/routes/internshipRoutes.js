const express = require("express");
const router = express.Router();
const Internship = require("../models/Internship");
const User = require("../models/User");
const { protect, companyOnly, studentOnly } = require("../middleware/authMiddleware");
const { updateRoleRequirements } = require("../utils/csvHelper");
const { createNotification } = require("../utils/notificationService");

const DEADLINE_ALERT_WINDOW_DAYS = 3;

const buildSavedInternshipPayload = (item) => {
  const internship = item.internship;
  const deadline = internship?.deadline ? new Date(internship.deadline) : null;
  const now = new Date();
  const daysUntilDeadline = deadline
    ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    _id: internship?._id,
    title: internship?.title,
    companyName: internship?.companyName,
    location: internship?.location,
    type: internship?.type,
    description: internship?.description,
    skills: internship?.skills || [],
    deadline: internship?.deadline,
    postedBy: internship?.postedBy,
    savedAt: item.savedAt,
    daysUntilDeadline,
    isDeadlineNear:
      typeof daysUntilDeadline === "number" &&
      daysUntilDeadline >= 0 &&
      daysUntilDeadline <= DEADLINE_ALERT_WINDOW_DAYS,
  };
};

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

router.get("/saved", protect, studentOnly, async (req, res) => {
  try {
    const student = await User.findById(req.user.id).populate({
      path: "savedInternships.internship",
      model: "Internship",
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    let shouldSave = false;
    const activeSavedInternships = [];

    for (const item of student.savedInternships || []) {
      if (!item.internship) {
        shouldSave = true;
        continue;
      }

      const deadline = item.internship.deadline ? new Date(item.internship.deadline) : null;
      const now = new Date();
      const daysUntilDeadline = deadline
        ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const shouldAlert =
        deadline &&
        daysUntilDeadline >= 0 &&
        daysUntilDeadline <= DEADLINE_ALERT_WINDOW_DAYS &&
        !item.deadlineAlertSentAt;

      if (shouldAlert) {
        await createNotification({
          recipient: student._id,
          actor: item.internship.postedBy || null,
          type: "saved_internship_deadline",
          title: "Saved internship deadline is near",
          message: `${item.internship.title} at ${item.internship.companyName} closes in ${daysUntilDeadline} day(s).`,
          link: "/saved-internships",
          metadata: {
            internshipId: item.internship._id,
            daysUntilDeadline,
          },
        });
        item.deadlineAlertSentAt = new Date();
        shouldSave = true;
      }

      activeSavedInternships.push(item);
    }

    student.savedInternships = activeSavedInternships;

    if (shouldSave) {
      await student.save();
    }

    const savedInternships = activeSavedInternships
      .map(buildSavedInternshipPayload)
      .sort((a, b) => new Date(a.savedAt) - new Date(b.savedAt));

    res.json(savedInternships);
  } catch (error) {
    console.log("Get saved internships error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/:id/save", protect, studentOnly, async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);

    if (!internship) {
      return res.status(404).json({ message: "Internship not found" });
    }

    const student = await User.findById(req.user.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const alreadySaved = (student.savedInternships || []).some(
      (item) => String(item.internship) === String(internship._id),
    );

    if (alreadySaved) {
      return res.status(400).json({ message: "Internship already saved" });
    }

    student.savedInternships.push({
      internship: internship._id,
      savedAt: new Date(),
      deadlineAlertSentAt: null,
    });
    await student.save();

    res.status(201).json({ message: "Internship saved successfully" });
  } catch (error) {
    console.log("Save internship error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id/save", protect, studentOnly, async (req, res) => {
  try {
    const student = await User.findById(req.user.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const initialLength = student.savedInternships.length;
    student.savedInternships = student.savedInternships.filter(
      (item) => String(item.internship) !== String(req.params.id),
    );

    if (student.savedInternships.length === initialLength) {
      return res.status(404).json({ message: "Saved internship not found" });
    }

    await student.save();

    res.json({ message: "Internship removed from saved list" });
  } catch (error) {
    console.log("Remove saved internship error:", error);
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
