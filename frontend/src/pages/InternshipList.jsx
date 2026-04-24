import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";
import { getStoredUser } from "../utils/session";

function InternshipList() {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState([]);
  const [savingId, setSavingId] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [sortBy, setSortBy] = useState("");
  const user = getStoredUser();

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        const res = await api.get("/internships");
        setInternships(res.data);
      } catch (error) {
        console.log("Error fetching internships:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInternships();
  }, []);

  useEffect(() => {
    const fetchSavedInternships = async () => {
      if (!user || user.role !== "student") {
        return;
      }

      try {
        const res = await api.get("/internships/saved");
        setSavedIds(res.data.map((item) => item._id));
      } catch (error) {
        console.log("Error fetching saved internships:", error);
      }
    };

    fetchSavedInternships();
  }, [user]);

  const handleSaveToggle = async (internshipId, isSaved) => {
    try {
      setSavingId(internshipId);

      if (isSaved) {
        await api.delete(`/internships/${internshipId}/save`);
        setSavedIds((current) => current.filter((id) => id !== internshipId));
      } else {
        await api.post(`/internships/${internshipId}/save`);
        setSavedIds((current) => [...current, internshipId]);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update saved internships");
    } finally {
      setSavingId("");
    }
  };

  const filteredInternships = useMemo(() => {
    let filtered = [...internships];

    filtered = filtered.filter((item) => {
      const matchesSearch =
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.companyName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter ? item.type === typeFilter : true;

      const matchesLocation = locationFilter
        ? item.location?.toLowerCase().includes(locationFilter.toLowerCase())
        : true;

      return matchesSearch && matchesType && matchesLocation;
    });

    if (sortBy === "deadline-asc") {
      filtered.sort(
        (a, b) => new Date(a.deadline) - new Date(b.deadline)
      );
    } else if (sortBy === "deadline-desc") {
      filtered.sort(
        (a, b) => new Date(b.deadline) - new Date(a.deadline)
      );
    } else if (sortBy === "title-asc") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    return filtered;
  }, [internships, searchTerm, typeFilter, locationFilter, sortBy]);

  return (
    <div className="list-page">
      <div className="list-container">
        <div className="list-header">
          <h1>Available Internships</h1>
          <p>Explore opportunities and apply for the role that fits you best.</p>
        </div>

        <div className="filter-bar">
          <input
            type="text"
            placeholder="Search by title or company"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-input"
          />

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-input"
          >
            <option value="">All Types</option>
            <option value="Remote">Remote</option>
            <option value="On-site">On-site</option>
            <option value="Hybrid">Hybrid</option>
          </select>

          <input
            type="text"
            placeholder="Filter by location"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="filter-input"
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-input"
          >
            <option value="">Sort By</option>
            <option value="deadline-asc">Deadline: Nearest</option>
            <option value="deadline-desc">Deadline: Latest</option>
            <option value="title-asc">Title: A-Z</option>
          </select>
        </div>

        {loading ? (
          <p className="status-text">Loading internships...</p>
        ) : filteredInternships.length === 0 ? (
          <p className="status-text">No internships found.</p>
        ) : (
          <div className="internship-grid">
            {filteredInternships.map((item) => (
              <div key={item._id} className="internship-card">
                <div className="card-top">
                  <h2>{item.title}</h2>
                  <div className="card-top-badges">
                    <span className="type-badge">{item.type}</span>
                    {savedIds.includes(item._id) && (
                      <span className="saved-badge">Saved</span>
                    )}
                  </div>
                </div>

                <p className="company-name">{item.companyName}</p>

                <p className="card-info">
                  <strong>Location:</strong> {item.location}
                </p>

                <p className="card-info">
                  <strong>Deadline:</strong>{" "}
                  {item.deadline
                    ? new Date(item.deadline).toLocaleDateString()
                    : "Not provided"}
                </p>

                {item.deadline && (
                  <p className="deadline-note">
                    {Math.ceil(
                      (new Date(item.deadline).getTime() - Date.now()) /
                        (1000 * 60 * 60 * 24),
                    ) >= 0
                      ? `${Math.ceil(
                          (new Date(item.deadline).getTime() - Date.now()) /
                            (1000 * 60 * 60 * 24),
                        )} day(s) left to apply`
                      : "Deadline passed"}
                  </p>
                )}

                <p className="description">
                  {(item.description || "").length > 120
                    ? `${item.description.substring(0, 120)}...`
                    : item.description || "No description available."}
                </p>

                <div className="skills-wrap">
                  {item.skills?.map((skill, index) => (
                    <span key={index} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="card-actions">
                  <Link to={`/internship/${item._id}`} className="details-btn">
                    View Details
                  </Link>
                  {user?.role === "student" && (
                    <button
                      type="button"
                      className={`save-internship-btn ${savedIds.includes(item._id) ? "active" : ""}`}
                      onClick={() => handleSaveToggle(item._id, savedIds.includes(item._id))}
                      disabled={savingId === item._id}
                    >
                      {savingId === item._id
                        ? "Saving..."
                        : savedIds.includes(item._id)
                          ? "Saved"
                          : "Save"}
                    </button>
                  )}
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

export default InternshipList;
