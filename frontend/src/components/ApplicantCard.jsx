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

    return (
        <div className="applicant-card">
            <h3>{student.name || applicant.studentName || "Unknown applicant"}</h3>
            <p><strong>Email:</strong> {student.email || applicant.email || "Not provided"}</p>
            <p><strong>University:</strong> {student.university || "Not provided"}</p>
            <p><strong>Degree:</strong> {student.degree || "Not provided"}</p>
            <p><strong>GPA:</strong> {student.gpa ?? "Not provided"}</p>
            <p><strong>Skills:</strong> {skills.length > 0 ? skills.join(", ") : "Not provided"}</p>
            <p><strong>Status:</strong> <span style={{ color: getStatusColor(applicant.status) }}>{applicant.status}</span></p>
            <p><strong>Skill Match:</strong> {applicant.skillMatchPercentage ?? 0}%</p>

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
