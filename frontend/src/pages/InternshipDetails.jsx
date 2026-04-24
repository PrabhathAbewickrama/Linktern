import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import { getStoredUser } from "../utils/session";

function InternshipDetails() {
  const { id } = useParams();
  const [internship, setInternship] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const user = getStoredUser();

  useEffect(() => {
    const fetchInternship = async () => {
      try {
        const res = await api.get(`/internships/${id}`);
        setInternship(res.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchInternship();
  }, [id]);

  useEffect(() => {
    const fetchSavedInternships = async () => {
      if (!user || user.role !== "student") {
        return;
      }

      try {
        const res = await api.get("/internships/saved");
        setIsSaved(res.data.some((item) => item._id === id));
      } catch (error) {
        console.log(error);
      }
    };

    fetchSavedInternships();
  }, [id, user]);

  const handleSaveToggle = async () => {
    try {
      setSaving(true);

      if (isSaved) {
        await api.delete(`/internships/${id}/save`);
        setIsSaved(false);
      } else {
        await api.post(`/internships/${id}/save`);
        setIsSaved(true);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update saved internships");
    } finally {
      setSaving(false);
    }
  };

  if (!internship) return <p>Loading...</p>;

  return (
    <div className="details-card">
      <h1>{internship.title}</h1>
      <p>
        <strong>Company:</strong>{" "}
        {internship.postedBy ? (
          <Link to={`/profile/${internship.postedBy}`}>
            {internship.companyName}
          </Link>
        ) : (
          internship.companyName
        )}
      </p>
      <p>
        <strong>Location:</strong> {internship.location}
      </p>
      <p>
        <strong>Type:</strong> {internship.type}
      </p>
      <p>
        <strong>Description:</strong> {internship.description}
      </p>
      <p>
        <strong>Skills:</strong> {internship.skills.join(", ")}
      </p>
      <p>
        <strong>Deadline:</strong>{" "}
        {new Date(internship.deadline).toLocaleDateString()}
      </p>

      <div className="details-actions">
        {user?.role === "student" && (
          <button
            type="button"
            className={`btn secondary-btn save-detail-btn ${isSaved ? "active" : ""}`}
            onClick={handleSaveToggle}
            disabled={saving}
          >
            {saving ? "Saving..." : isSaved ? "Saved Internship" : "Save Internship"}
          </button>
        )}

        <Link className="btn" to={`/apply/${internship._id}`}>
          Apply Now
        </Link>
      </div>
    </div>
  );
}

export default InternshipDetails;
