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
        <form style={styles.form} onSubmit={submitInterview}>
            <h3>Suggest 4 Interview Slots</h3>

            <label style={styles.label}>Option 1</label>
            <input
                type="datetime-local"
                value={form.slot1}
                onChange={(e) => updateField("slot1", e.target.value)}
                required
                style={styles.input}
            />

            <label style={styles.label}>Option 2</label>
            <input
                type="datetime-local"
                value={form.slot2}
                onChange={(e) => updateField("slot2", e.target.value)}
                required
                style={styles.input}
            />

            <label style={styles.label}>Option 3</label>
            <input
                type="datetime-local"
                value={form.slot3}
                onChange={(e) => updateField("slot3", e.target.value)}
                required
                style={styles.input}
            />

            <label style={styles.label}>Option 4</label>
            <input
                type="datetime-local"
                value={form.slot4}
                onChange={(e) => updateField("slot4", e.target.value)}
                required
                style={styles.input}
            />

            <label style={styles.label}>Mode</label>
            <select
                value={form.interviewMode}
                onChange={(e) => updateField("interviewMode", e.target.value)}
                style={styles.input}
            >
                <option value="Online">Online</option>
                <option value="Physical">Physical</option>
            </select>

            <label style={styles.label}>Meeting Link</label>
            <input
                type="text"
                value={form.meetingLink}
                onChange={(e) => updateField("meetingLink", e.target.value)}
                style={styles.input}
                placeholder="https://..."
                required={form.interviewMode === "Online"}
            />

            <label style={styles.label}>Location</label>
            <input
                type="text"
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
                style={styles.input}
                placeholder="Office address"
                required={form.interviewMode === "Physical"}
            />

            <label style={styles.label}>Notes</label>
            <textarea
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                style={styles.input}
                placeholder="Additional details"
            />

            <div style={styles.actions}>
                <button type="submit" style={styles.saveBtn}>Send Slots</button>
                <button type="button" onClick={onClose} style={styles.cancelBtn}>Cancel</button>
            </div>
        </form>
    );
}

const styles = {
    form: {
        border: "1px solid #ddd",
        borderRadius: "12px",
        padding: "16px",
        marginTop: "12px",
        background: "#fff"
    },
    label: {
        display: "block",
        marginTop: "10px",
        marginBottom: "4px",
        fontWeight: 600
    },
    input: {
        width: "100%",
        padding: "10px",
        borderRadius: "8px",
        border: "1px solid #ccc",
        boxSizing: "border-box"
    },
    actions: {
        display: "flex",
        gap: "10px",
        marginTop: "14px"
    },
    saveBtn: {
        background: "#198754",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        padding: "10px 14px",
        cursor: "pointer"
    },
    cancelBtn: {
        background: "#6c757d",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        padding: "10px 14px",
        cursor: "pointer"
    }
};

export default ScheduleInterviewForm;
