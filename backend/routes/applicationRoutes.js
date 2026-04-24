const express = require("express");
const router = express.Router();
const multer = require("multer");
const Application = require("../models/Application");
const { protect, studentOnly } = require("../middleware/authMiddleware");
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

    const application = await Application.create({
      internshipId: req.body.internshipId,
      studentId,
      studentName: req.user.name,
      email: req.user.email,
      cvFile: req.file.filename
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
