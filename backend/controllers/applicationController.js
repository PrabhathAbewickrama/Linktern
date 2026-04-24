const Application = require("../models/Application");
const Internship = require("../models/Internship");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const { createNotification } = require("../utils/notificationService");

const calculateSkillMatch = (studentSkills = [], requiredSkills = []) => {
    if (requiredSkills.length === 0) return 0;

    const studentSkillLower = studentSkills.map((skill) => skill.toLowerCase());
    const matched = requiredSkills.filter((skill) =>
        studentSkillLower.includes(skill.toLowerCase())
    );

    return Math.round((matched.length / requiredSkills.length) * 100);
};

const qualifiesForShortlist = (student, internship, skillMatchPercentage) => {
    const degreeOk =
        !internship.requiredDegree ||
        student.degree?.toLowerCase() === internship.requiredDegree.toLowerCase();

    const gpaOk = !internship.minGpa || (student.gpa || 0) >= internship.minGpa;

    const skillOk = internship.requiredSkills.length === 0 || skillMatchPercentage >= 60;

    return degreeOk && gpaOk && skillOk;
};

const shortlistEmailTemplate = (studentName, internship) => `
    <h2>Application Shortlisted</h2>
    <p>Dear ${studentName},</p>
    <p>Your application has been shortlisted for <b>${internship.title}</b> at <b>${internship.companyName}</b>.</p>
    <p>The company will send you 4 interview date and time options soon, and you will be able to choose one.</p>
    <br/>
    <p>Best regards,</p>
    <p>${internship.companyName}</p>
`;

const approvalEmailTemplate = (studentName, internship) => `
    <h2>Application Approved</h2>
    <p>Dear ${studentName},</p>
    <p>Your application for <b>${internship.title}</b> at <b>${internship.companyName}</b> has been approved.</p>
    <p>Please book a time slot once the interview options are shared with you.</p>
    <p>You will receive another email with the available interview time slots soon.</p>
    <br/>
    <p>Best regards,</p>
    <p>Admin Team</p>
`;

const autoShortlistApplications = async (applications, internship) => {
    await Promise.all(
        applications.map(async (app) => {
            const match = calculateSkillMatch(
                app.studentId.skills,
                internship.requiredSkills
            );

            const shouldShortlist = qualifiesForShortlist(
                app.studentId,
                internship,
                match
            );

            const nextStatus = shouldShortlist ? "Shortlisted" : "Pending";
            const update = { skillMatchPercentage: match };

            if (app.status !== nextStatus) {
                update.status = nextStatus;
            }

            if (
                shouldShortlist &&
                app.studentId.email &&
                app.shortlistEmailSent !== true
            ) {
                try {
                    await sendEmail(
                        app.studentId.email,
                        "You have been shortlisted",
                        shortlistEmailTemplate(app.studentId.name, internship)
                    );
                    update.shortlistEmailSent = true;
                } catch (emailError) {
                    console.error("Shortlist email failed:", emailError.message);
                }
            }

            if (Object.keys(update).length > 0) {
                await Application.findByIdAndUpdate(app._id, update);
            }

            app.skillMatchPercentage = match;
            app.status = nextStatus;
            if (update.shortlistEmailSent === true) {
                app.shortlistEmailSent = true;
            }
            return app;
        })
    );
};

exports.getApplicantsByInternship = async (req, res) => {
    try {
        const { internshipId } = req.params;

        const internship = await Internship.findById(internshipId);
        if (!internship) {
            return res.status(404).json({ message: "Internship not found" });
        }

        let applications = await Application.find({ internshipId: internshipId })
            .populate("studentId")
            .populate("internshipId");

        // Calculate skill match for display purposes only
        applications = applications.map(app => {
            const match = calculateSkillMatch(
                app.studentId.skills,
                internship.requiredSkills
            );
            return {
                ...app.toObject(),
                skillMatchPercentage: match
            };
        });

        // Sort by skill match percentage for better viewing
        applications.sort((a, b) => b.skillMatchPercentage - a.skillMatchPercentage);

        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.filterApplicants = async (req, res) => {
    try {
        const { internshipId } = req.params;
        const { skill, degree, minGpa, university } = req.query;

        const internship = await Internship.findById(internshipId);
        if (!internship) {
            return res.status(404).json({ message: "Internship not found" });
        }

        let applications = await Application.find({ internshipId: internshipId })
            .populate("studentId")
            .populate("internshipId");

        // Calculate skill match for all applications
        applications = applications.map(app => {
            const match = calculateSkillMatch(
                app.studentId.skills,
                internship.requiredSkills
            );
            return {
                ...app.toObject(),
                skillMatchPercentage: match
            };
        });

        const filtered = applications.filter((app) => {
            const s = app.studentId;

            if (
                skill &&
                !s.skills.some((item) =>
                    item.toLowerCase().includes(skill.toLowerCase())
                )
            ) {
                return false;
            }

            if (degree && s.degree?.toLowerCase() !== degree.toLowerCase()) {
                return false;
            }

            if (minGpa && (s.gpa || 0) < Number(minGpa)) {
                return false;
            }

            if (
                university &&
                s.university?.toLowerCase() !== university.toLowerCase()
            ) {
                return false;
            }

            return true;
        });

        filtered.sort((a, b) => b.skillMatchPercentage - a.skillMatchPercentage);

        res.json(filtered);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.shortlistApplicant = async (req, res) => {
    try {
        const { applicationId } = req.params;

        const application = await Application.findByIdAndUpdate(
            applicationId,
            { status: "Shortlisted" },
            { new: true }
        )
            .populate("studentId")
            .populate("internshipId");

        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        let emailSent = false;

        if (application.studentId?.email) {
            try {
                await sendEmail(
                    application.studentId.email,
                    "Your application has been approved",
                    approvalEmailTemplate(
                        application.studentId.name || application.studentName || "Student",
                        application.internshipId
                    )
                );
                emailSent = true;
            } catch (emailError) {
                console.error("Approval email failed:", emailError.message);
            }
        }

        await createNotification({
            recipient: application.studentId._id,
            actor: application.internshipId?.postedBy || null,
            type: "application_approved",
            title: "Application approved",
            message: `Your application for ${application.internshipId.title} at ${application.internshipId.companyName} was approved. Please book a time slot when the company shares interview options.`,
            link: "/student-interviews",
            metadata: {
                applicationId: application._id,
                internshipId: application.internshipId._id,
            },
        });

        res.json({
            message: emailSent
                ? "Applicant approved and email sent successfully"
                : "Applicant approved, but email sending failed",
            application,
            emailSent
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.rejectApplicant = async (req, res) => {
    try {
        const { applicationId } = req.params;

        const application = await Application.findByIdAndUpdate(
            applicationId,
            { status: "Rejected" },
            { new: true }
        )
            .populate("studentId")
            .populate("internshipId");

        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        await createNotification({
            recipient: application.studentId._id,
            actor: application.internshipId?.postedBy || null,
            type: "application_rejected",
            title: "Application update",
            message: `Your application for ${application.internshipId.title} at ${application.internshipId.companyName} was not selected this time.`,
            link: "/feed",
            metadata: {
                applicationId: application._id,
                internshipId: application.internshipId._id,
            },
        });

        res.json({
            message: "Applicant rejected successfully",
            application
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
