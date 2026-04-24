const mongoose = require("mongoose");
const Interview = require("../models/Interview");
const Application = require("../models/Application");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const isValidDate = (value) => !Number.isNaN(new Date(value).getTime());

const formatSlotList = (slots = []) =>
    slots
        .map((slot, index) => `<li>Option ${index + 1}: ${new Date(slot).toLocaleString()}</li>`)
        .join("");

const resolveStudent = async (studentIdentifier) => {
    const trimmed = (studentIdentifier || "").trim();
    if (!trimmed) return null;

    if (mongoose.Types.ObjectId.isValid(trimmed)) {
        const byDbId = await User.findById(trimmed);
        if (byDbId && byDbId.role === "student") return byDbId;
    }

    return User.findOne({ studentId: trimmed.toUpperCase(), role: "student" });
};

exports.proposeInterview = async (req, res) => {
    try {
        const {
            applicationId,
            slotOptions,
            interviewMode,
            meetingLink,
            location,
            notes
        } = req.body;

        const application = await Application.findById(applicationId)
            .populate("studentId")
            .populate("internshipId");

        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        if (application.status !== "Shortlisted") {
            return res.status(400).json({
                message: "Only shortlisted applications can receive interview slots"
            });
        }

        if (!Array.isArray(slotOptions) || slotOptions.length !== 4) {
            return res.status(400).json({
                message: "Provide exactly 4 interview date/time options"
            });
        }

        const normalizedSlots = slotOptions.map((slot) => new Date(slot));

        if (normalizedSlots.some((slot) => Number.isNaN(slot.getTime()))) {
            return res.status(400).json({
                message: "Each interview option must be a valid date and time"
            });
        }

        if (interviewMode === "Online" && !meetingLink?.trim()) {
            return res.status(400).json({
                message: "Meeting link is required for online interviews"
            });
        }

        if (interviewMode === "Physical" && !location?.trim()) {
            return res.status(400).json({
                message: "Location is required for physical interviews"
            });
        }

        const interview = await Interview.findOneAndUpdate(
            { application: applicationId },
            {
                application: applicationId,
                slotOptions: normalizedSlots,
                selectedSlot: null,
                interviewMode,
                meetingLink: meetingLink || "",
                location: location || "",
                notes: notes || "",
                status: "Pending Student Selection"
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true
            }
        );

        const student = application.studentId;
        const internship = application.internshipId;

        let emailSent = false;
        try {
            await sendEmail(
                student.email,
                "Interview Slot Selection",
                `
                <h2>Interview Invitation</h2>
                <p>Dear ${student.name},</p>
                <p>${internship.companyName} has proposed 4 interview options for <b>${internship.title}</b>.</p>
                <p>Please log in and choose one slot.</p>
                <p><b>Mode:</b> ${interviewMode}</p>
                <p><b>Meeting Link:</b> ${meetingLink || "N/A"}</p>
                <p><b>Location:</b> ${location || "N/A"}</p>
                <p><b>Notes:</b> ${notes || "No additional notes"}</p>
                <ul>${formatSlotList(normalizedSlots)}</ul>
                <br/>
                <p>Best regards,</p>
                <p>${internship.companyName}</p>
                `
            );
            emailSent = true;
        } catch (emailError) {
            console.error("Interview email failed:", emailError.message);
        }

        res.status(201).json({
            message: emailSent
                ? "Interview slots sent to the student successfully"
                : "Interview slots saved, but email sending failed",
            interview,
            emailSent
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.selectInterviewSlot = async (req, res) => {
    try {
        const { interviewId } = req.params;
        const { studentId, selectedSlot } = req.body;

        if (!isValidDate(selectedSlot)) {
            return res.status(400).json({ message: "Choose a valid interview slot" });
        }

        const interview = await Interview.findById(interviewId).populate({
            path: "application",
            populate: [
                { path: "studentId" },
                { path: "internshipId" }
            ]
        });

        if (!interview) {
            return res.status(404).json({ message: "Interview invitation not found" });
        }

        const normalizedStudentId = (studentId || "").trim().toUpperCase();
        const matchesDbId = interview.application.studentId._id.toString() === studentId;
        const matchesStudentId =
            interview.application.studentId.studentId?.toUpperCase() === normalizedStudentId;

        if (!matchesDbId && !matchesStudentId) {
            return res.status(403).json({
                message: "Only the invited student can select an interview slot"
            });
        }

        const chosenDate = new Date(selectedSlot);
        const matchedSlot = interview.slotOptions.find(
            (slot) => new Date(slot).getTime() === chosenDate.getTime()
        );

        if (!matchedSlot) {
            return res.status(400).json({
                message: "Selected slot must match one of the company-provided options"
            });
        }

        interview.selectedSlot = chosenDate;
        interview.status = "Confirmed";
        await interview.save();

        interview.application.status = "Interview Scheduled";
        await interview.application.save();

        const student = interview.application.studentId;
        const internship = interview.application.internshipId;

        try {
            await sendEmail(
                student.email,
                "Interview Confirmed",
                `
                <h2>Interview Confirmed</h2>
                <p>Dear ${student.name},</p>
                <p>Your interview for <b>${internship.title}</b> at <b>${internship.companyName}</b> is confirmed.</p>
                <p><b>Date & Time:</b> ${chosenDate.toLocaleString()}</p>
                <p><b>Mode:</b> ${interview.interviewMode}</p>
                <p><b>Meeting Link:</b> ${interview.meetingLink || "N/A"}</p>
                <p><b>Location:</b> ${interview.location || "N/A"}</p>
                <p><b>Notes:</b> ${interview.notes || "No additional notes"}</p>
                `
            );
        } catch (emailError) {
            console.error("Interview confirmation email failed:", emailError.message);
        }

        res.json({
            message: "Interview slot selected successfully",
            interview
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getStudentInterviews = async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await resolveStudent(studentId);

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const applications = await Application.find({ studentId: student._id });
        const applicationIds = applications.map((app) => app._id);

        const interviews = await Interview.find({
            application: { $in: applicationIds }
        }).populate({
            path: "application",
            populate: [
                { path: "studentId" },
                { path: "internshipId" }
            ]
        });

        res.json(interviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getStudentShortlistedApplications = async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await resolveStudent(studentId);

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const applications = await Application.find({
            studentId: student._id,
            status: "Shortlisted"
        }).populate("internshipId");

        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
