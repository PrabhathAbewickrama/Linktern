import React, { useState, useEffect } from "react";
import api from "../api";
import { getStoredUser } from "../utils/session";
import "./student-interview-page.css";

const includesText = (value, searchTerm) =>
  String(value || "").toLowerCase().includes(searchTerm.toLowerCase());

function StudentInterviewPage() {
  const [interviews, setInterviews] = useState([]);
  const [shortlistedApps, setShortlistedApps] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    companyName: "",
    internshipTitle: "",
    interviewMode: "all",
    stage: "all",
  });

  const user = getStoredUser();

  useEffect(() => {
    if (user && user.role === "student") {
      fetchData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchData = async () => {
    try {
      const [shortlistedRes, interviewRes] = await Promise.all([
        api.get(`/interviews/student/${user.id}/shortlisted`),
        api.get(`/interviews/student/${user.id}`),
      ]);

      setShortlistedApps(shortlistedRes.data);
      setInterviews(interviewRes.data);
    } catch (error) {
      console.error("Failed to load student data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "student") {
    return (
      <div className="interview-page">
        <section className="interview-section">
          <p className="interview-guard">
            Only logged-in students can access this page.
          </p>
        </section>
      </div>
    );
  }

  const pendingInvitations = interviews.filter(
    (item) => item.status === "Pending Student Selection",
  );
  const confirmedInterviews = interviews.filter(
    (item) => item.status === "Confirmed",
  );
  const shortlistedWithoutInvite = shortlistedApps.filter(
    (app) => !interviews.some((item) => item.application?._id === app._id),
  );

  const matchesFilters = (item, stage) => {
    const companyName =
      item?.internshipId?.companyName ||
      item?.application?.internshipId?.companyName ||
      "";
    const internshipTitle =
      item?.internshipId?.title ||
      item?.application?.internshipId?.title ||
      "";
    const interviewMode = item?.interviewMode || "";

    const companyMatches =
      !filters.companyName || includesText(companyName, filters.companyName);
    const titleMatches =
      !filters.internshipTitle ||
      includesText(internshipTitle, filters.internshipTitle);
    const modeMatches =
      filters.interviewMode === "all" ||
      interviewMode.toLowerCase() === filters.interviewMode.toLowerCase();
    const stageMatches =
      filters.stage === "all" || filters.stage === stage;

    return companyMatches && titleMatches && modeMatches && stageMatches;
  };

  const filteredShortlistedWithoutInvite = shortlistedWithoutInvite.filter((app) =>
    matchesFilters(app, "awaiting-invitation"),
  );
  const filteredPendingInvitations = pendingInvitations.filter((item) =>
    matchesFilters(item, "pending-selection"),
  );
  const filteredConfirmedInterviews = confirmedInterviews.filter((item) =>
    matchesFilters(item, "confirmed"),
  );

  const clearFilters = () => {
    setFilters({
      companyName: "",
      internshipTitle: "",
      interviewMode: "all",
      stage: "all",
    });
  };

  const chooseSlot = async (interviewId) => {
    const selectedSlot = selectedSlots[interviewId];

    if (!selectedSlot) {
      alert("Please select one of the proposed interview slots.");
      return;
    }

    try {
      await api.post(`/interviews/${interviewId}/select-slot`, {
        studentId: user.id,
        selectedSlot,
      });
      alert("Interview slot selected successfully");
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to confirm interview slot");
    }
  };

  const renderMeta = (label, value) => (
    <div className="interview-meta-item">
      <strong>{label}</strong>
      <span>{value || "N/A"}</span>
    </div>
  );

  return (
    <div className="interview-page">
      <section className="interview-hero">
        <span className="interview-kicker">INTERVIEWS</span>
        <h1>Student Interview Portal</h1>
        <p>
          Welcome, {user.name}! Review shortlist updates, choose your preferred
          interview slot, and keep track of confirmed sessions.
        </p>
      </section>

      <section className="interview-section interview-filter-section">
        <div className="interview-filter-header">
          <div>
            <h2>Filter Interviews</h2>
            <p>
              Narrow the portal by company name, internship title, stage, or
              interview mode.
            </p>
          </div>
          <button
            type="button"
            className="interview-filter-clear"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>

        <div className="interview-filter-grid">
          <input
            type="text"
            className="interview-filter-input"
            placeholder="Company name"
            value={filters.companyName}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                companyName: event.target.value,
              }))
            }
          />

          <input
            type="text"
            className="interview-filter-input"
            placeholder="Internship title"
            value={filters.internshipTitle}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                internshipTitle: event.target.value,
              }))
            }
          />

          <select
            className="interview-filter-input"
            value={filters.stage}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                stage: event.target.value,
              }))
            }
          >
            <option value="all">All stages</option>
            <option value="awaiting-invitation">Awaiting invitation</option>
            <option value="pending-selection">Pending selection</option>
            <option value="confirmed">Confirmed</option>
          </select>

          <select
            className="interview-filter-input"
            value={filters.interviewMode}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                interviewMode: event.target.value,
              }))
            }
          >
            <option value="all">All interview modes</option>
            <option value="online">Online</option>
            <option value="physical">Physical</option>
          </select>
        </div>
      </section>

      {loading ? (
        <section className="interview-section">
          <p className="interview-loading">Loading your data...</p>
        </section>
      ) : (
        <div className="interview-sections">
          <section className="interview-section">
            <h2>Awaiting Company Invitation</h2>
            <p>Applications shortlisted by companies but still waiting for slot proposals.</p>
            <div className="interview-card-grid">
              {filteredShortlistedWithoutInvite.length === 0 ? (
                <p className="interview-empty">
                  No shortlisted applications match the current filters.
                </p>
              ) : (
                filteredShortlistedWithoutInvite.map((app) => (
                  <article key={app._id} className="interview-card">
                    <span className="interview-status-pill">{app.status}</span>
                    <h3>{app.internshipId?.title}</h3>
                    <div className="interview-card-meta">
                      {renderMeta("Company", app.internshipId?.companyName)}
                      {renderMeta("Status", app.status)}
                    </div>
                    <p>Waiting for the company to provide 4 interview time slots.</p>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="interview-section">
            <h2>Select Your Interview Slot</h2>
            <p>Choose one of the company’s proposed times to confirm your interview.</p>
            <div className="interview-card-grid">
              {filteredPendingInvitations.length === 0 ? (
                <p className="interview-empty">
                  No interview invitations match the current filters.
                </p>
              ) : (
                filteredPendingInvitations.map((item) => (
                  <article key={item._id} className="interview-card">
                    <span className="interview-status-pill">Pending Selection</span>
                    <h3>{item.application.internshipId.title}</h3>
                    <div className="interview-card-meta">
                      {renderMeta("Company", item.application.internshipId.companyName)}
                      {renderMeta("Mode", item.interviewMode)}
                      {renderMeta("Meeting Link", item.meetingLink || "N/A")}
                      {renderMeta("Location", item.location || "N/A")}
                    </div>
                    <p>{item.notes || "No additional notes provided."}</p>

                    <div className="interview-slots">
                      {item.slotOptions.map((slot) => (
                        <label key={slot} className="interview-slot-label">
                          <input
                            type="radio"
                            name={`interview-${item._id}`}
                            value={slot}
                            checked={selectedSlots[item._id] === slot}
                            onChange={(event) =>
                              setSelectedSlots((current) => ({
                                ...current,
                                [item._id]: event.target.value,
                              }))
                            }
                          />
                          <span>{new Date(slot).toLocaleString()}</span>
                        </label>
                      ))}
                    </div>

                    <button
                      onClick={() => chooseSlot(item._id)}
                      className="interview-button"
                    >
                      Confirm This Interview Slot
                    </button>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="interview-section">
            <h2>My Confirmed Interviews</h2>
            <p>Your finalized interview schedule appears here.</p>
            <div className="interview-card-grid">
              {filteredConfirmedInterviews.length === 0 ? (
                <p className="interview-empty">
                  No confirmed interviews match the current filters.
                </p>
              ) : (
                filteredConfirmedInterviews.map((item) => (
                  <article key={item._id} className="interview-card">
                    <span className="interview-status-pill">Confirmed</span>
                    <h3>{item.application.internshipId.title}</h3>
                    <div className="interview-card-meta">
                      {renderMeta("Company", item.application.internshipId.companyName)}
                      {renderMeta("Date", new Date(item.selectedSlot).toLocaleString())}
                      {renderMeta("Mode", item.interviewMode)}
                      {renderMeta("Meeting Link", item.meetingLink || "N/A")}
                      {renderMeta("Location", item.location || "N/A")}
                      {renderMeta("Notes", item.notes || "-")}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default StudentInterviewPage;
