import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import PostCard from "../components/posts/PostCard";
import postService from "../services/postService";
import { getStoredUser } from "../utils/session";
import "../components/posts/posts.css";

const createEmptyRatingForm = (companyName = "") => ({
  companyName,
  internshipTitle: "",
  rating: 0,
  workMode: "Remote",
  startDate: "",
  endDate: "",
  stipend: 0,
  review: "",
  pros: "",
  cons: "",
  recommendations: "",
});

const formatDateForInput = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().split("T")[0];
};

const getDurationPreview = (startDate, endDate) => {
  if (!startDate || !endDate) return "Select dates above";

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return "Invalid date range";
  }

  const totalDays = Math.max(
    1,
    Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1,
  );
  const months = Math.floor(totalDays / 30);
  const days = totalDays % 30;

  if (months > 0 && days > 0) return `${months} month(s) ${days} day(s)`;
  if (months > 0) return `${months} month(s)`;

  return `${totalDays} day(s)`;
};

function Profile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const viewer = getStoredUser();
  const isOwnProfile = !userId || String(viewer?.id) === String(userId);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [editing, setEditing] = useState(false);
  const [myPosts, setMyPosts] = useState([]);
  const [postFilter, setPostFilter] = useState("all");
  const [postError, setPostError] = useState("");
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingDeleting, setRatingDeleting] = useState(false);
  const [accountDeleting, setAccountDeleting] = useState(false);
  const [ratingStarFilter, setRatingStarFilter] = useState("all");
  const [ratingWorkModeFilter, setRatingWorkModeFilter] = useState("all");
  const [ratingSearch, setRatingSearch] = useState("");
  const [ratingForm, setRatingForm] = useState(createEmptyRatingForm());
  const [form, setForm] = useState({
    name: "",
    username: "",
    profilePicture: null,
    university: "",
    degree: "",
    gpa: "",
    skills: "",
  });
  const [previewImage, setPreviewImage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchProfile();
    fetchProfilePosts();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const url = isOwnProfile
        ? "http://localhost:5000/api/users/profile"
        : `http://localhost:5000/api/users/${userId}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(res.data);
      setForm({
        name: res.data.name,
        username: res.data.username || "",
        profilePicture: null,
        university: res.data.university || "",
        degree: res.data.degree || "",
        gpa: res.data.gpa || "",
        skills: res.data.skills ? res.data.skills.join(", ") : "",
      });
      setPreviewImage(
        res.data.profilePicture
          ? `http://localhost:5000${res.data.profilePicture}`
          : "https://via.placeholder.com/120x120?text=No+Image",
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load profile");
      if (err.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProfilePosts = async () => {
    try {
      setLoadingPosts(true);
      setPostError("");
      const posts = isOwnProfile
        ? await postService.getMyPosts()
        : await postService.getUserPosts(userId);
      setMyPosts(Array.isArray(posts) ? posts : []);
    } catch (err) {
      setPostError(
        err.response?.data?.message || "Failed to load this profile activity",
      );
    } finally {
      setLoadingPosts(false);
    }
  };

  const existingViewerReview = useMemo(() => {
    if (!user?.reviews || !viewer?.id) return null;
    return user.reviews.find(
      (item) => String(item.student) === String(viewer.id),
    );
  }, [user, viewer]);

  useEffect(() => {
    const companyDisplayName = user?.companyName || user?.name || "";

    if (existingViewerReview) {
      setRatingForm({
        companyName: existingViewerReview.companyName || companyDisplayName,
        internshipTitle: existingViewerReview.internshipTitle || "",
        rating: Number(existingViewerReview.rating || 0),
        workMode: existingViewerReview.workMode || "Remote",
        startDate: formatDateForInput(existingViewerReview.startDate),
        endDate: formatDateForInput(existingViewerReview.endDate),
        stipend: Number(existingViewerReview.stipend || 0),
        review: existingViewerReview.review || "",
        pros: existingViewerReview.pros || "",
        cons: existingViewerReview.cons || "",
        recommendations: existingViewerReview.recommendations || "",
      });
    } else {
      setRatingForm(createEmptyRatingForm(companyDisplayName));
    }
  }, [existingViewerReview, user]);

  const filteredPosts = useMemo(() => {
    if (postFilter === "created") {
      return myPosts.filter((post) => post.postType !== "share");
    }

    if (postFilter === "shared") {
      return myPosts.filter((post) => post.postType === "share");
    }

    return myPosts;
  }, [myPosts, postFilter]);

  const filteredReviews = useMemo(() => {
    const reviews = Array.isArray(user?.reviews) ? user.reviews : [];
    const normalizedSearch = ratingSearch.trim().toLowerCase();

    return reviews.filter((item) => {
      const matchesStar =
        ratingStarFilter === "all" ||
        Number(item.rating || 0) === Number(ratingStarFilter);

      const matchesWorkMode =
        ratingWorkModeFilter === "all" ||
        String(item.workMode || "").toLowerCase() ===
          ratingWorkModeFilter.toLowerCase();

      const reviewerName =
        `${item.studentName || ""} ${item.studentUsername || ""}`
          .trim()
          .toLowerCase();

      const matchesSearch =
        !normalizedSearch || reviewerName.includes(normalizedSearch);

      return matchesStar && matchesWorkMode && matchesSearch;
    });
  }, [user, ratingStarFilter, ratingWorkModeFilter, ratingSearch]);

  const reviewDurationPreview = useMemo(
    () => getDurationPreview(ratingForm.startDate, ratingForm.endDate),
    [ratingForm.startDate, ratingForm.endDate],
  );

  const canRateCompany =
    viewer?.role === "student" && user?.role === "company" && !isOwnProfile;

  const handlePostUpdated = (updatedPost) => {
    setMyPosts((currentPosts) => {
      const exists = currentPosts.some((item) => item._id === updatedPost._id);

      if (exists) {
        return currentPosts.map((item) =>
          item._id === updatedPost._id ? updatedPost : item,
        );
      }

      return [updatedPost, ...currentPosts];
    });
  };

  const handlePostDeleted = (postId) => {
    setMyPosts((currentPosts) =>
      currentPosts.filter((item) => item._id !== postId),
    );
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, profilePicture: file });
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleRatingInputChange = (field, value) => {
    setRatingForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      formData.append("name", form.name);
      if (form.username) formData.append("username", form.username);
      if (form.profilePicture) {
        formData.append("profilePicture", form.profilePicture);
      }
      if (form.university) formData.append("university", form.university);
      if (form.degree) formData.append("degree", form.degree);
      if (form.gpa) formData.append("gpa", form.gpa);
      if (form.skills) {
        formData.append(
          "skills",
          form.skills.split(",").map((s) => s.trim()),
        );
      }

      const res = await axios.put(
        "http://localhost:5000/api/users/profile",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setUser(res.data.user);
      setSuccess("Profile updated successfully");
      setEditing(false);
      localStorage.setItem("user", JSON.stringify(res.data.user));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleSubmitRating = async () => {
    if (!ratingForm.rating) {
      setError("Please choose a star rating before submitting.");
      return;
    }

    if (!ratingForm.internshipTitle.trim()) {
      setError("Please enter the internship title.");
      return;
    }

    if (!ratingForm.startDate || !ratingForm.endDate) {
      setError("Please select both start and end dates.");
      return;
    }

    if (reviewDurationPreview === "Invalid date range") {
      setError("End date must be after the start date.");
      return;
    }

    if (ratingForm.review.trim().length < 50) {
      setError("Your review must be at least 50 characters long.");
      return;
    }

    try {
      setRatingSubmitting(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");
      const payload = {
        ...ratingForm,
        companyName: user?.companyName || user?.name || ratingForm.companyName,
        review: ratingForm.review.trim(),
        pros: ratingForm.pros.trim(),
        cons: ratingForm.cons.trim(),
        recommendations: ratingForm.recommendations.trim(),
        durationLabel: reviewDurationPreview,
      };

      const res = await axios.post(
        `http://localhost:5000/api/users/${user._id}/rate`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setUser(res.data.user);
      setSuccess(res.data.message || "Company rated successfully");
      setShowRatingForm(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit your rating");
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleDeleteRating = async () => {
    if (!existingViewerReview) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete your rating for this company?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setRatingDeleting(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");
      const res = await axios.delete(
        `http://localhost:5000/api/users/${user._id}/rate`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setUser(res.data.user);
      setRatingForm(
        createEmptyRatingForm(user?.companyName || user?.name || ""),
      );
      setShowRatingForm(false);
      setSuccess(res.data.message || "Your rating has been deleted.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete your rating");
    } finally {
      setRatingDeleting(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your student account? This will permanently remove your profile, posts, comments, likes, and company reviews.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setAccountDeleting(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");
      const res = await axios.delete("http://localhost:5000/api/users/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      alert(res.data.message || "Your account has been deleted.");
      navigate("/login");
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete account");
    } finally {
      setAccountDeleting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (!user) {
    return <div className="error">Profile not found</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h1>
          {isOwnProfile
            ? "My Profile"
            : user.role === "company"
              ? "Company Profile"
              : "User Profile"}
        </h1>

        {error && <p className="message error-message">{error}</p>}
        {success && <p className="message success-message">{success}</p>}

        <div className="profile-info">
          <div className="profile-picture-section">
            <img
              src={
                previewImage ||
                "https://via.placeholder.com/120x120?text=No+Image"
              }
              alt="Profile"
              className="profile-picture"
            />
            {editing && isOwnProfile && (
              <div className="file-upload">
                <label htmlFor="profilePicture" className="upload-btn">
                  Change Picture
                </label>
                <input
                  type="file"
                  id="profilePicture"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </div>
            )}
          </div>

          <div className="profile-details">
            <div className="detail-item">
              <label>Email:</label>
              <span>{user.email}</span>
            </div>

            <div className="detail-item">
              <label>Role:</label>
              <span>{user.role === "student" ? "Student" : "Company"}</span>
            </div>

            {user.role === "student" && (
              <>
                <div className="detail-item">
                  <label>University:</label>
                  <span>{user.university || "Not set"}</span>
                </div>
                <div className="detail-item">
                  <label>Degree:</label>
                  <span>{user.degree || "Not set"}</span>
                </div>
                <div className="detail-item">
                  <label>GPA:</label>
                  <span>{user.gpa || "Not set"}</span>
                </div>
                <div className="detail-item">
                  <label>Skills:</label>
                  <span>
                    {user.skills && user.skills.length > 0
                      ? user.skills.join(", ")
                      : "Not set"}
                  </span>
                </div>
              </>
            )}

            {user.role === "company" && user.companyName && (
              <div className="detail-item">
                <label>Company Name:</label>
                <span>{user.companyName}</span>
              </div>
            )}

            {!editing || !isOwnProfile ? (
              <>
                <div className="detail-item">
                  <label>Name:</label>
                  <span>{user.name}</span>
                </div>

                <div className="detail-item">
                  <label>Username:</label>
                  <span>{user.username || "Not set"}</span>
                </div>

                {isOwnProfile && (
                  <div className="profile-action-row">
                    <button className="edit-btn" onClick={() => setEditing(true)}>
                      Edit Profile
                    </button>
                    {user.role === "student" && (
                      <button
                        type="button"
                        className="delete-account-btn"
                        onClick={handleDeleteAccount}
                        disabled={accountDeleting}
                      >
                        {accountDeleting ? "Deleting..." : "Delete Account"}
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={handleSubmit} className="edit-form">
                <div className="form-group">
                  <label>Name:</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Username:</label>
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                  />
                </div>

                {user.role === "student" && (
                  <>
                    <div className="form-group">
                      <label>University:</label>
                      <input
                        type="text"
                        name="university"
                        value={form.university}
                        onChange={handleChange}
                        placeholder="e.g. SLIIT"
                      />
                    </div>

                    <div className="form-group">
                      <label>Degree:</label>
                      <input
                        type="text"
                        name="degree"
                        value={form.degree}
                        onChange={handleChange}
                        placeholder="e.g. Computer Science"
                      />
                    </div>

                    <div className="form-group">
                      <label>GPA:</label>
                      <input
                        type="number"
                        name="gpa"
                        value={form.gpa}
                        onChange={handleChange}
                        placeholder="e.g. 3.5"
                        step="0.1"
                        min="0"
                        max="4"
                      />
                    </div>

                    <div className="form-group">
                      <label>Skills:</label>
                      <input
                        type="text"
                        name="skills"
                        value={form.skills}
                        onChange={handleChange}
                        placeholder="JavaScript, React, Node.js"
                      />
                    </div>
                  </>
                )}

                <div className="form-actions">
                  <button type="submit" className="save-btn">
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setEditing(false);
                      setForm({
                        name: user.name,
                        username: user.username || "",
                        profilePicture: null,
                        university: user.university || "",
                        degree: user.degree || "",
                        gpa: user.gpa || "",
                        skills: user.skills ? user.skills.join(", ") : "",
                      });
                      setPreviewImage(
                        user.profilePicture
                          ? `http://localhost:5000${user.profilePicture}`
                          : "https://via.placeholder.com/120x120?text=No+Image",
                      );
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {user.role === "company" && (
        <div className="profile-posts-card company-rating-card">
          <div className="profile-posts-header">
            <h2>Student Ratings</h2>
            <p>
              Average rating:{" "}
              <strong>{Number(user.averageRating || 0).toFixed(1)}</strong> / 5
              &nbsp;·&nbsp;{user.ratingCount || 0} review(s)
            </p>
          </div>

          <div className="company-rating-summary">
            <div
              className="rating-stars-display"
              aria-label={`Average rating ${user.averageRating || 0} out of 5`}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`rating-star ${star <= Math.round(user.averageRating || 0) ? "filled" : ""}`}
                >
                  ★
                </span>
              ))}
            </div>

            {canRateCompany && (
              <button
                type="button"
                className="edit-btn"
                onClick={() => setShowRatingForm((value) => !value)}
              >
                {existingViewerReview ? "Edit My Rating" : "Rate ME"}
              </button>
            )}
          </div>

          {canRateCompany && existingViewerReview && !showRatingForm && (
            <p className="profile-rating-note">
              You already rated this company. You can edit or delete your review
              anytime.
            </p>
          )}

          {canRateCompany && showRatingForm && (
            <div
              className="review-modal-overlay"
              onClick={(event) => {
                if (
                  event.target === event.currentTarget &&
                  !ratingSubmitting &&
                  !ratingDeleting
                ) {
                  setShowRatingForm(false);
                }
              }}
            >
              <div className="review-modal">
                <div className="review-modal-header">
                  <div>
                    <h3>
                      {existingViewerReview
                        ? "Edit Your Review"
                        : "Write a Review"}
                    </h3>
                    <p>Share your internship experience with other students.</p>
                  </div>
                  <button
                    type="button"
                    className="review-modal-close"
                    onClick={() => setShowRatingForm(false)}
                    disabled={ratingSubmitting || ratingDeleting}
                    aria-label="Close review form"
                  >
                    ×
                  </button>
                </div>

                <div className="review-form-grid">
                  <div className="review-form-group">
                    <label>Company Name</label>
                    <input
                      type="text"
                      value={ratingForm.companyName}
                      readOnly
                      className="review-readonly-input"
                    />
                  </div>

                  <div className="review-form-group">
                    <label>Internship Title *</label>
                    <input
                      type="text"
                      value={ratingForm.internshipTitle}
                      onChange={(event) =>
                        handleRatingInputChange(
                          "internshipTitle",
                          event.target.value,
                        )
                      }
                      placeholder="e.g., Software Engineering Intern"
                    />
                  </div>

                  <div className="review-form-group review-form-group-full">
                    <div className="review-label-row">
                      <label>Rating *</label>
                      <span className="review-helper-text">
                        {ratingForm.rating
                          ? `${ratingForm.rating}/5 stars`
                          : "Select your rating"}
                      </span>
                    </div>
                    <div className="rating-stars-input review-form-stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`rating-star-btn ${star <= ratingForm.rating ? "filled" : ""}`}
                          onClick={() =>
                            handleRatingInputChange("rating", star)
                          }
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="review-form-group">
                    <label>Work Mode *</label>
                    <select
                      value={ratingForm.workMode}
                      onChange={(event) =>
                        handleRatingInputChange("workMode", event.target.value)
                      }
                    >
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Onsite">Onsite</option>
                      <option value="Flexible">Flexible</option>
                    </select>
                  </div>

                  <div className="review-form-group">
                    <label>Start Date *</label>
                    <input
                      type="date"
                      value={ratingForm.startDate}
                      onChange={(event) =>
                        handleRatingInputChange("startDate", event.target.value)
                      }
                    />
                  </div>

                  <div className="review-form-group">
                    <label>End Date *</label>
                    <input
                      type="date"
                      value={ratingForm.endDate}
                      onChange={(event) =>
                        handleRatingInputChange("endDate", event.target.value)
                      }
                    />
                  </div>

                  <div className="review-form-group">
                    <label>Duration (Auto-calculated)</label>
                    <input
                      type="text"
                      value={reviewDurationPreview}
                      readOnly
                      className="review-readonly-input"
                    />
                  </div>

                  <div className="review-form-group review-form-group-full">
                    <label>Stipend (Monthly in $)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={ratingForm.stipend}
                      onChange={(event) =>
                        handleRatingInputChange("stipend", event.target.value)
                      }
                      placeholder="0"
                    />
                  </div>

                  <div className="review-form-group review-form-group-full">
                    <div className="review-label-row">
                      <label>Review *</label>
                      <span className="review-helper-text">
                        {ratingForm.review.length}/2000 (minimum 50)
                      </span>
                    </div>
                    <textarea
                      className="company-review-textarea"
                      value={ratingForm.review}
                      onChange={(event) =>
                        handleRatingInputChange("review", event.target.value)
                      }
                      rows="6"
                      maxLength="2000"
                      placeholder="Share your experience with this internship, work culture, mentorship, and what other students should know..."
                    />
                  </div>

                  <div className="review-form-group review-form-group-full">
                    <label>Pros (Optional)</label>
                    <textarea
                      className="company-review-textarea"
                      value={ratingForm.pros}
                      onChange={(event) =>
                        handleRatingInputChange("pros", event.target.value)
                      }
                      rows="3"
                      placeholder="What did you like about this internship?"
                    />
                  </div>

                  <div className="review-form-group review-form-group-full">
                    <label>Cons (Optional)</label>
                    <textarea
                      className="company-review-textarea"
                      value={ratingForm.cons}
                      onChange={(event) =>
                        handleRatingInputChange("cons", event.target.value)
                      }
                      rows="3"
                      placeholder="What could be improved?"
                    />
                  </div>

                  <div className="review-form-group review-form-group-full">
                    <label>Recommendations (Optional)</label>
                    <textarea
                      className="company-review-textarea"
                      value={ratingForm.recommendations}
                      onChange={(event) =>
                        handleRatingInputChange(
                          "recommendations",
                          event.target.value,
                        )
                      }
                      rows="3"
                      placeholder="Any advice for future interns?"
                    />
                  </div>
                </div>

                <div className="review-modal-actions">
                  {existingViewerReview && (
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={handleDeleteRating}
                      disabled={ratingSubmitting || ratingDeleting}
                    >
                      {ratingDeleting ? "Deleting..." : "Delete Rating"}
                    </button>
                  )}
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowRatingForm(false)}
                    disabled={ratingSubmitting || ratingDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="save-btn"
                    onClick={handleSubmitRating}
                    disabled={ratingSubmitting || ratingDeleting}
                  >
                    {ratingSubmitting
                      ? "Submitting..."
                      : existingViewerReview
                        ? "Update Review"
                        : "Submit Review"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {Array.isArray(user.reviews) && user.reviews.length > 0 ? (
            <>
              <div className="rating-filter-bar">
                <select
                  className="rating-filter-select"
                  value={ratingStarFilter}
                  onChange={(event) => setRatingStarFilter(event.target.value)}
                >
                  <option value="all">All star ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>

                <select
                  className="rating-filter-select"
                  value={ratingWorkModeFilter}
                  onChange={(event) => setRatingWorkModeFilter(event.target.value)}
                >
                  <option value="all">All work modes</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Onsite">Onsite</option>
                  <option value="Flexible">Flexible</option>
                </select>

                <input
                  type="text"
                  className="rating-filter-search"
                  value={ratingSearch}
                  onChange={(event) => setRatingSearch(event.target.value)}
                  placeholder="Search by reviewer name or username"
                />
              </div>

              {filteredReviews.length > 0 ? (
                <div className="company-reviews-list">
                  {filteredReviews.map((item) => (
                    <div key={item._id} className="company-review-item">
                      <div className="company-review-top">
                        <strong>
                          {item.studentName ||
                            item.studentUsername ||
                            "Student"}
                        </strong>
                        <span>
                          {new Date(
                            item.updatedAt || item.createdAt,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      {String(item.student) === String(viewer?.id) && (
                        <div className="profile-rating-note own-rating-inline">
                          This is your review.
                        </div>
                      )}
                      <div className="rating-stars-display review-stars-inline">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`rating-star ${star <= Number(item.rating || 0) ? "filled" : ""}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>

                      <div className="review-meta-row">
                        <span className="review-detail-pill">
                          {item.internshipTitle || "Internship Experience"}
                        </span>
                        <span className="review-detail-pill">
                          {item.workMode || "Not specified"}
                        </span>
                        {item.durationLabel && (
                          <span className="review-detail-pill">
                            {item.durationLabel}
                          </span>
                        )}
                        <span className="review-detail-pill">
                          ${Number(item.stipend || 0).toLocaleString()}/month
                        </span>
                      </div>

                      <p>{item.review || "No written review provided."}</p>

                      {(item.pros || item.cons || item.recommendations) && (
                        <div className="review-extra-grid">
                          {item.pros && (
                            <div className="review-extra-card">
                              <h4>Pros</h4>
                              <p>{item.pros}</p>
                            </div>
                          )}
                          {item.cons && (
                            <div className="review-extra-card">
                              <h4>Cons</h4>
                              <p>{item.cons}</p>
                            </div>
                          )}
                          {item.recommendations && (
                            <div className="review-extra-card review-extra-card-full">
                              <h4>Recommendations</h4>
                              <p>{item.recommendations}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="profile-post-empty">
                  No ratings match the selected star, work mode, or reviewer search.
                </div>
              )}
            </>
          ) : (
            <div className="profile-post-empty">
              No ratings yet. Student reviews will appear here.
            </div>
          )}
        </div>
      )}

      <div className="profile-posts-card">
        <div className="profile-posts-header">
          <h2>{isOwnProfile ? "My Posts & Shares" : "Profile Timeline"}</h2>
          <p>
            {isOwnProfile
              ? "Everything you created or reshared appears here like a social profile timeline."
              : "Recent posts and reshared updates from this profile are shown here."}
          </p>
        </div>

        <div className="profile-post-tabs">
          <button
            type="button"
            className={`profile-tab-btn ${postFilter === "all" ? "active" : ""}`}
            onClick={() => setPostFilter("all")}
          >
            All Activity
          </button>
          <button
            type="button"
            className={`profile-tab-btn ${postFilter === "created" ? "active" : ""}`}
            onClick={() => setPostFilter("created")}
          >
            My Posts
          </button>
          <button
            type="button"
            className={`profile-tab-btn ${postFilter === "shared" ? "active" : ""}`}
            onClick={() => setPostFilter("shared")}
          >
            Shared Posts
          </button>
        </div>

        {postError && <p className="message error-message">{postError}</p>}

        {loadingPosts ? (
          <div className="loading">Loading activity...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="profile-post-empty">
            No posts or shared posts are available for this profile yet.
          </div>
        ) : (
          <div className="profile-posts-list">
            {filteredPosts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onPostUpdated={handlePostUpdated}
                onPostCreated={handlePostUpdated}
                onPostDeleted={handlePostDeleted}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
