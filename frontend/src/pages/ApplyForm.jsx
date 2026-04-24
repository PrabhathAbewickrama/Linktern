import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { getStoredUser } from "../utils/session";

function ApplyForm() {
  const { id } = useParams();

  const [form, setForm] = useState({
    studentName: "",
    email: "",
    cvFile: null
  });

  const [errors, setErrors] = useState({});
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileUser, setProfileUser] = useState(null);
  const token = localStorage.getItem("token");
  const user = getStoredUser();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token || !user || user.role !== "student") {
        setProfileLoading(false);
        return;
      }

      try {
        const res = await axios.get("http://localhost:5000/api/users/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setProfileUser(res.data);
      } catch (error) {
        console.log(error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [token, user]);

  if (!user || user.role !== "student") {
    return <p>Only registered students can apply for internships.</p>;
  }

  if (profileLoading) {
    return <p>Loading your profile...</p>;
  }

  const activeStudent = profileUser || user;
  const profileComplete =
    Boolean(String(activeStudent?.name || "").trim()) &&
    Boolean(String(activeStudent?.email || "").trim()) &&
    Boolean(String(activeStudent?.university || "").trim()) &&
    Boolean(String(activeStudent?.degree || "").trim()) &&
    Number(activeStudent?.gpa || 0) > 0 &&
    Array.isArray(activeStudent?.skills) &&
    activeStudent.skills.length > 0;

  if (!profileComplete) {
    return (
      <div className="page-wrapper">
        <div className="form-card">
          <div className="form-header">
            <h1>Update Your Profile First</h1>
            <p>
              Before applying for an internship, please complete your student profile
              details.
            </p>
          </div>

          <div className="message error-message">
            Update your university, degree, GPA, and skills in your profile before
            submitting an application.
          </div>

          <Link to="/profile" className="submit-btn" style={{ textAlign: "center" }}>
            Go to Profile
          </Link>
        </div>
      </div>
    );
  }

  const validate = () => {
    const newErrors = {};

    if (!form.studentName.trim()) {
      newErrors.studentName = "Name is required";
    } else if (form.studentName.trim().length < 3) {
      newErrors.studentName = "Name must be at least 3 characters";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!form.cvFile) {
      newErrors.cvFile = "Please upload your CV";
    } else {
      const allowedTypes = ["application/pdf"];
      if (!allowedTypes.includes(form.cvFile.type)) {
        newErrors.cvFile = "Only PDF files are allowed";
      }

      const maxSize = 2 * 1024 * 1024;
      if (form.cvFile.size > maxSize) {
        newErrors.cvFile = "File size must be less than 2MB";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setForm({ ...form, cvFile: file });
    setErrors({ ...errors, cvFile: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const formData = new FormData();
    formData.append("internshipId", id);
    formData.append("studentName", form.studentName);
    formData.append("email", form.email);
    formData.append("cvFile", form.cvFile);

    try {
      await axios.post("http://localhost:5000/api/applications", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      });

      alert("Application submitted successfully");

      setForm({
        studentName: "",
        email: "",
        cvFile: null
      });

      setErrors({});
      e.target.reset();
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Application failed");
    }
  };

  return (
    <div className="page-wrapper">
      <div className="form-card">
        <div className="form-header">
          <h1>Apply for Internship</h1>
          <p>Complete the form below to submit your application.</p>
        </div>

        <form className="modern-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              name="studentName"
              placeholder="Enter your full name"
              value={form.studentName}
              onChange={handleChange}
              className={errors.studentName ? "input-error" : ""}
            />
            {errors.studentName && (
              <span className="error-text">{errors.studentName}</span>
            )}
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              className={errors.email ? "input-error" : ""}
            />
            {errors.email && (
              <span className="error-text">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label>Upload CV</label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className={errors.cvFile ? "input-error" : ""}
            />
            {errors.cvFile && (
              <span className="error-text">{errors.cvFile}</span>
            )}
          </div>

          <button type="submit" className="submit-btn">
            Submit Application
          </button>
        </form>
      </div>
    </div>
  );
}

export default ApplyForm;
