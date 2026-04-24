const express = require("express");
const router = express.Router();
const multer = require("multer");
const Application = require("../models/Application");
const Internship = require("../models/Internship");
const User = require("../models/User");
const { protect, studentOnly } = require("../middleware/authMiddleware");
const { createNotification } = require("../utils/notificationService");
const {
    getApplicantsByInternship,
    filterApplicants,
    shortlistApplicant,
    rejectApplicant
} = require("../controllers/applicationController");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

router.post("/", protect, studentOnly, upload.single("cvFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "CV file is required" });
    }

    const studentId = req.user.id || req.user._id;

    if (!studentId) {
      return res.status(500).json({ message: "Unable to determine student ID from token" });
    }

    const student = await User.findById(studentId).select(
      "name email university degree gpa skills",
    );

    const profileComplete =
      Boolean(String(student?.name || "").trim()) &&
      Boolean(String(student?.email || "").trim()) &&
      Boolean(String(student?.university || "").trim()) &&
      Boolean(String(student?.degree || "").trim()) &&
      Number(student?.gpa || 0) > 0 &&
      Array.isArray(student?.skills) &&
      student.skills.length > 0;

    if (!profileComplete) {
      return res.status(400).json({
        message:
          "Please update your profile details before applying for internships.",
      });
    }

    const application = await Application.create({
      internshipId: req.body.internshipId,
      studentId,
      studentName: req.user.name,
      email: req.user.email,
      cvFile: req.file.filename
    });

    const internship = await Internship.findById(req.body.internshipId).select(
      "title companyName postedBy",
    );

    if (internship?.postedBy) {
      await createNotification({
        recipient: internship.postedBy,
        actor: studentId,
        type: "new_application",
        title: "New internship application",
        message: `${req.user.name} applied for ${internship.title} at ${internship.companyName}.`,
        link: "/company-applicants",
        metadata: {
          applicationId: application._id,
          internshipId: internship._id,
        },
      });
    }

    await createNotification({
      recipient: studentId,
      actor: internship?.postedBy || null,
      type: "application_submitted",
      title: "Application submitted",
      message: internship
        ? `Your application for ${internship.title} was submitted successfully.`
        : "Your internship application was submitted successfully.",
      link: "/student-interviews",
      metadata: {
        applicationId: application._id,
        internshipId: req.body.internshipId,
      },
    });

    res.status(201).json({
      message: "Application submitted successfully",
      application
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("internshipId")
      .populate("studentId");
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// New routes for CV filtering
router.get("/internship/:internshipId", getApplicantsByInternship);
router.get("/internship/:internshipId/filter", filterApplicants);
router.put("/:applicationId/shortlist", shortlistApplicant);
router.put("/:applicationId/reject", rejectApplicant);

module.exports = router;
