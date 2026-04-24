import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Brain,
  CheckCircle,
  AlertCircle,
  Target,
  Sparkles,
  BookOpen,
} from "lucide-react";
import "./skill-gap-analyzer.css";

function SkillGapAnalyzer() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [cvFile, setCvFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [courseDifficulty, setCourseDifficulty] = useState("");
  const [recommendedCourses, setRecommendedCourses] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [courseError, setCourseError] = useState("");

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      setError("");
      const response = await axios.get("http://localhost:5000/api/roles");
      const rolesData = Array.isArray(response.data?.roles)
        ? response.data.roles
        : [];
      setRoles(rolesData);
    } catch (err) {
      console.error("Failed to fetch roles", err);
      setRoles([]);
      setError("Failed to load roles from backend.");
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();

    if (!selectedRole || !cvFile) {
      setError("Please select a role and upload your CV.");
      return;
    }

    if (cvFile.type !== "application/pdf") {
      setError("Please upload a valid PDF file.");
      return;
    }

    if (cvFile.size > 5 * 1024 * 1024) {
      setError("File size should not exceed 5MB.");
      return;
    }

    try {
      setAnalyzing(true);
      setError("");
      setResult(null);
      setRecommendedCourses(null);
      setCourseDifficulty("");
      setCourseError("");

      const formData = new FormData();
      formData.append("targetRole", selectedRole);
      formData.append("cv", cvFile);

      const response = await axios.post(
        "http://localhost:5000/api/skill-gap-ai",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data?.success) {
        setResult(response.data);
      } else {
        setError(response.data?.error || "Analysis failed.");
      }
    } catch (err) {
      console.error("Failed to analyze skills", err);
      setError(err.response?.data?.error || "Failed to analyze skills.");
      setResult(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const fetchCourses = async () => {
    if (!courseDifficulty) {
      setCourseError("Please select a difficulty validation.");
      return;
    }

    if (!result?.missingSkills || result.missingSkills.length === 0) {
      setCourseError("No missing skills to recommend courses for.");
      return;
    }

    try {
      setLoadingCourses(true);
      setCourseError("");

      const response = await axios.post(
        "http://localhost:5000/api/course-recommendations",
        {
          missingSkills: result.missingSkills,
          difficulty: courseDifficulty,
        },
      );

      if (response.data?.success) {
        setRecommendedCourses(response.data.courses);
      } else {
        setCourseError(response.data?.error || "Failed to fetch courses.");
      }
    } catch (err) {
      console.error("Failed to fetch courses", err);
      setCourseError(
        err.response?.data?.error || "Failed to fetch course recommendations.",
      );
    } finally {
      setLoadingCourses(false);
    }
  };

  return (
    <div className="skill-page">
      <section className="skill-hero">
        <div className="skill-hero-icon">
          <Brain size={28} />
        </div>
        <div>
          <h1>Skill Gap Analyzer</h1>
          <p>
            Compare your CV against your target role, identify missing skills,
            and discover courses that help close the gap faster.
          </p>
        </div>
      </section>

      <section className="skill-shell">
        {error && <div className="skill-alert">{error}</div>}

        <form onSubmit={handleAnalyze} className="skill-form">
          <div className="skill-field">
            <label>Target Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="skill-select"
            >
              <option value="">
                {loadingRoles ? "Loading roles..." : "Select your target role"}
              </option>
              {roles.map((role, index) => (
                <option key={index} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="skill-field">
            <label>Upload CV (PDF)</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setCvFile(e.target.files[0])}
              className="skill-file"
            />
            <p className="skill-helper">
              Supported format: PDF only. Maximum file size: 5MB.
            </p>
          </div>

          <div className="skill-field skill-field-full">
            <button type="submit" disabled={analyzing} className="skill-btn">
              {analyzing ? "Analyzing..." : "Analyze Skill Gap"}
            </button>
          </div>
        </form>

        {result && (
          <div className="skill-results">
            <div className="skill-stats">
              <div className="skill-card">
                <div className="skill-label-row">
                  <Target size={16} />
                  <span>Target Role</span>
                </div>
                <p className="skill-value">{result.targetRole || "N/A"}</p>
              </div>

              <div className="skill-card">
                <div className="skill-label-row">
                  <Sparkles size={16} />
                  <span>Match Score</span>
                </div>
                <p className="skill-value">{result.score ?? 0}%</p>
              </div>

              <div className="skill-card">
                <div className="skill-label-row">
                  <CheckCircle size={16} />
                  <span>Level</span>
                </div>
                <p className="skill-value">{result.level || "N/A"}</p>
              </div>
            </div>

            <div className="skill-panels">
              <div className="skill-card">
                <h3>Matched Skills</h3>
                {(result.matchedSkills || []).length > 0 ? (
                  <ul className="skill-list">
                    {(result.matchedSkills || []).map((skill, index) => (
                      <li key={index}>
                        <CheckCircle size={16} className="skill-icon-match" />
                        <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="skill-muted">No matched skills found.</p>
                )}
              </div>

              <div className="skill-card">
                <h3>Missing Skills</h3>
                {(result.missingSkills || []).length > 0 ? (
                  <ul className="skill-list">
                    {(result.missingSkills || []).map((skill, index) => (
                      <li key={index}>
                        <AlertCircle size={16} className="skill-icon-miss" />
                        <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="skill-muted">No missing skills. Great job!</p>
                )}
              </div>
            </div>

            <div className="skill-card">
              <h3>Recommendations</h3>
              {(result.recommendations || []).length > 0 ? (
                <ul className="skill-recommendations">
                  {(result.recommendations || []).map((item, index) => (
                    <li key={index}>
                      <Sparkles size={16} className="skill-icon-match" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="skill-muted">No recommendations available.</p>
              )}
            </div>

            {result?.missingSkills?.length > 0 && (
              <div className="skill-card">
                <div className="skill-course-top">
                  <BookOpen size={20} />
                  <h3>Course Recommendations for Missing Skills</h3>
                </div>

                {courseError && <div className="skill-alert">{courseError}</div>}

                <div className="skill-course-controls">
                  <div className="skill-course-field">
                    <label>Select Difficulty Path</label>
                    <select
                      value={courseDifficulty}
                      onChange={(e) => setCourseDifficulty(e.target.value)}
                      className="skill-select"
                    >
                      <option value="">Select difficulty</option>
                      <option value="low">Low - Beginner</option>
                      <option value="medium">Medium - Intermediate</option>
                      <option value="high">High - Advanced</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={fetchCourses}
                    disabled={loadingCourses}
                    className="skill-btn-secondary"
                  >
                    {loadingCourses ? "Loading..." : "Get Courses"}
                  </button>
                </div>

                {recommendedCourses && (
                  <div>
                    {recommendedCourses.length > 0 ? (
                      <div className="skill-course-grid">
                        {recommendedCourses.map((course, idx) => (
                          <div key={idx} className="skill-course-card">
                            <h4>{course.name}</h4>
                            <p className="skill-course-meta">
                              <strong>Skills Covered:</strong> {course.skills}
                            </p>
                            <div className="skill-course-tags">
                              <span className="skill-chip">{course.difficulty}</span>
                              <span className="skill-confidence">
                                {course.matchConfidence}% Match
                              </span>
                            </div>
                            {course.url && (
                              <a
                                href={course.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="skill-course-link"
                              >
                                View Course
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="skill-muted">
                        No courses found for the selected difficulty.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default SkillGapAnalyzer;
