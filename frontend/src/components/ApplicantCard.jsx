import React, { useState } from "react";
import api from "../api";
import ScheduleInterviewForm from "./ScheduleInterviewForm";

function ApplicantCard({ applicant, onStatusChange }) {
    const student = applicant.studentId || {};
    const skills = Array.isArray(student.skills) ? student.skills : [];
    const [showInterviewForm, setShowInterviewForm] = useState(false);

    const handleApprove = async () => {
        try {
            const response = await api.put(`/applications/${applicant._id}/shortlist`);
            alert(response.data?.message || "Applicant approved successfully!");
            onStatusChange();
        } catch (error) {
            alert("Failed to approve applicant");
        }
    };

    const handleReject = async () => {
        try {
            await api.put(`/applications/${applicant._id}/reject`);
            alert("Applicant rejected successfully!");
            onStatusChange();
        } catch (error) {
            alert("Failed to reject applicant");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Shortlisted": return "#198754";
            case "Rejected": return "#dc3545";
            case "Interview Scheduled": return "#0d6efd";
            default: return "#6c757d";
        }
    };

    const displayName = student.name || applicant.studentName || "Unknown applicant";
    const initials = displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "NA";

    return (
        <div className="applicant-card">
            <div className="applicant-card-header">
                <div className="applicant-avatar">{initials}</div>
                <div className="applicant-title-block">
                    <h3>{displayName}</h3>
                    <p>{student.email || applicant.email || "Not provided"}</p>
                </div>
                <span
                    className="applicant-status-badge"
                    style={{ color: getStatusColor(applicant.status) }}
                >
                    {applicant.status}
                </span>
            </div>

            <div className="applicant-meta-grid">
                <div className="applicant-meta-item">
                    <span>University</span>
                    <strong>{student.university || "Not provided"}</strong>
                </div>
                <div className="applicant-meta-item">
                    <span>Degree</span>
                    <strong>{student.degree || "Not provided"}</strong>
                </div>
                <div className="applicant-meta-item">
                    <span>GPA</span>
                    <strong>{student.gpa ?? "Not provided"}</strong>
                </div>
                <div className="applicant-meta-item">
                    <span>Skill Match</span>
                    <strong>{applicant.skillMatchPercentage ?? 0}%</strong>
                </div>
            </div>

            <div className="applicant-skill-block">
                <span className="applicant-section-label">Skills</span>
                <div className="applicant-skill-list">
                    {skills.length > 0 ? (
                        skills.map((skill) => (
                            <span key={skill} className="applicant-skill-chip">
                                {skill}
                            </span>
                        ))
                    ) : (
                        <span className="applicant-skill-empty">Not provided</span>
                    )}
                </div>
            </div>

            {applicant.status === "Pending" && (
                <div className="applicant-card-actions">
                    <button onClick={handleApprove} className="applicant-approve-btn">Approve</button>
                    <button onClick={handleReject} className="applicant-reject-btn">Reject</button>
                </div>
            )}

            {applicant.status === "Shortlisted" && (
                <>
                    <div className="applicant-card-actions">
                        <button
                            onClick={() => setShowInterviewForm((value) => !value)}
                            className="applicant-schedule-btn"
                        >
                            {showInterviewForm ? "Hide Slot Form" : "Suggest 4 Interview Slots"}
                        </button>
                    </div>

                    {showInterviewForm && (
                        <ScheduleInterviewForm
                            applicationId={applicant._id}
                            onSuccess={onStatusChange}
                            onClose={() => setShowInterviewForm(false)}
                        />
                    )}
                </>
            )}
        </div>
    );
}

export default ApplicantCard;
