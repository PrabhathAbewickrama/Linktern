const express = require("express");
const router = express.Router();
const { protect, companyOnly, studentOnly } = require("../middleware/authMiddleware");
const {
    proposeInterview,
    selectInterviewSlot,
    getStudentInterviews,
    getStudentShortlistedApplications
} = require("../controllers/interviewController");

router.post("/propose", protect, companyOnly, proposeInterview);
router.post("/:interviewId/select-slot", protect, studentOnly, selectInterviewSlot);
router.get("/student/:studentId/shortlisted", protect, studentOnly, getStudentShortlistedApplications);
router.get("/student/:studentId", protect, studentOnly, getStudentInterviews);

module.exports = router;
