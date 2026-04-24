import React, { useState } from "react";
import api from "../api";

function ScheduleInterviewForm({ applicationId, onSuccess, onClose }) {
    const [form, setForm] = useState({
        slot1: "",
        slot2: "",
        slot3: "",
        slot4: "",
        interviewMode: "Online",
        meetingLink: "",
        location: "",
        notes: ""
    });

    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const submitInterview = async (event) => {
        event.preventDefault();
        try {
            await api.post("/interviews/propose", {
                applicationId,
                slotOptions: [form.slot1, form.slot2, form.slot3, form.slot4],
                interviewMode: form.interviewMode,
                meetingLink: form.meetingLink,
                location: form.location,
                notes: form.notes
            });
            alert("Interview options sent to the student");
            onSuccess();
            onClose();
        } catch (error) {
            alert(error.response?.data?.message || "Failed to send interview options");
        }
    };

    return (
        <form className="schedule-form" onSubmit={submitInterview}>
            <h3>Suggest 4 Interview Slots</h3>

            <label className="schedule-form-label">Option 1</label>
            <input
                type="datetime-local"
                value={form.slot1}
                onChange={(e) => updateField("slot1", e.target.value)}
                required
                className="schedule-form-input"
            />

            <label className="schedule-form-label">Option 2</label>
            <input
                type="datetime-local"
                value={form.slot2}
                onChange={(e) => updateField("slot2", e.target.value)}
                required
                className="schedule-form-input"
            />

            <label className="schedule-form-label">Option 3</label>
            <input
                type="datetime-local"
                value={form.slot3}
                onChange={(e) => updateField("slot3", e.target.value)}
                required
                className="schedule-form-input"
            />

            <label className="schedule-form-label">Option 4</label>
            <input
                type="datetime-local"
                value={form.slot4}
                onChange={(e) => updateField("slot4", e.target.value)}
                required
                className="schedule-form-input"
            />

            <label className="schedule-form-label">Mode</label>
            <select
                value={form.interviewMode}
                onChange={(e) => updateField("interviewMode", e.target.value)}
                className="schedule-form-input"
            >
                <option value="Online">Online</option>
                <option value="Physical">Physical</option>
            </select>

            <label className="schedule-form-label">Meeting Link</label>
            <input
                type="text"
                value={form.meetingLink}
                onChange={(e) => updateField("meetingLink", e.target.value)}
                className="schedule-form-input"
                placeholder="https://..."
                required={form.interviewMode === "Online"}
            />

            <label className="schedule-form-label">Location</label>
            <input
                type="text"
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
                className="schedule-form-input"
                placeholder="Office address"
                required={form.interviewMode === "Physical"}
            />

            <label className="schedule-form-label">Notes</label>
            <textarea
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                className="schedule-form-input"
                placeholder="Additional details"
            />

            <div className="schedule-form-actions">
                <button type="submit" className="schedule-save-btn">Send Slots</button>
                <button type="button" onClick={onClose} className="schedule-cancel-btn">Cancel</button>
            </div>
        </form>
    );
}

export default ScheduleInterviewForm;
