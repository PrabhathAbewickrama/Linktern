import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { getStoredUser } from "../utils/session";

function SavedInternships() {
  const [savedInternships, setSavedInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState("");
  const user = getStoredUser();

  useEffect(() => {
    const fetchSavedInternships = async () => {
      if (!user || user.role !== "student") {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/internships/saved");
        setSavedInternships(res.data);
      } catch (error) {
        console.log("Error fetching saved internships:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedInternships();
  }, [user]);

  const handleRemove = async (internshipId) => {
    try {
      setRemovingId(internshipId);
      await api.delete(`/internships/${internshipId}/save`);
      setSavedInternships((current) =>
        current.filter((item) => item._id !== internshipId),
      );
    } catch (error) {
      alert(error.response?.data?.message || "Failed to remove saved internship");
    } finally {
      setRemovingId("");
    }
  };

  if (!user || user.role !== "student") {
    return <p className="status-text">Only students can view saved internships.</p>;
  }

  return (
    <div className="list-page saved-internships-page">
      <div className="list-container">
        <div className="saved-internships-hero">
          <div>
            <span className="saved-internships-eyebrow">Student Shortlist</span>
            <h1>Saved Internships</h1>
            <p>
              Keep track of interesting roles, revisit them later, and watch deadline
              reminders before applications close.
            </p>
          </div>
          <div className="saved-internships-summary">
            <strong>{savedInternships.length}</strong>
            <span>saved opportunities</span>
          </div>
        </div>

        {loading ? (
          <p className="status-text">Loading saved internships...</p>
        ) : savedInternships.length === 0 ? (
          <div className="company-applicants-empty">
            <h3>No saved internships yet</h3>
            <p>Browse internships and save the ones you want to revisit later.</p>
          </div>
        ) : (
          <div className="internship-grid">
            {savedInternships.map((item) => (
              <div key={item._id} className="internship-card saved-internship-card">
                <div className="card-top">
                  <h2>{item.title}</h2>
                  <div className="card-top-badges">
                    <span className="type-badge">{item.type}</span>
                    {item.isDeadlineNear && (
                      <span className="deadline-alert-badge">Deadline Near</span>
                    )}
                  </div>
                </div>

                <p className="company-name">{item.companyName}</p>

                <p className="card-info">
                  <strong>Location:</strong> {item.location}
                </p>
                <p className="card-info">
                  <strong>Saved on:</strong>{" "}
                  {item.savedAt ? new Date(item.savedAt).toLocaleDateString() : "Today"}
                </p>
                <p className="card-info">
                  <strong>Deadline:</strong>{" "}
                  {item.deadline ? new Date(item.deadline).toLocaleDateString() : "Not provided"}
                </p>

                {typeof item.daysUntilDeadline === "number" && (
                  <p
                    className={`deadline-note ${item.isDeadlineNear ? "near" : ""}`}
                  >
                    {item.daysUntilDeadline >= 0
                      ? `${item.daysUntilDeadline} day(s) left to apply`
                      : "Deadline passed"}
                  </p>
                )}

                <p className="description">
                  {(item.description || "").length > 140
                    ? `${item.description.substring(0, 140)}...`
                    : item.description || "No description available."}
                </p>

                <div className="skills-wrap">
                  {item.skills?.map((skill) => (
                    <span key={skill} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="card-actions">
                  <Link to={`/internship/${item._id}`} className="details-btn">
                    View Details
                  </Link>
                  <button
                    type="button"
                    className="save-internship-btn active"
                    onClick={() => handleRemove(item._id)}
                    disabled={removingId === item._id}
                  >
                    {removingId === item._id ? "Removing..." : "Remove"}
                  </button>
                  <Link to={`/apply/${item._id}`} className="apply-btn">
                    Apply Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SavedInternships;
