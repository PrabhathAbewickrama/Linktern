import { useState } from "react";
import axios from "axios";

function AddInternship() {
  const initialForm = {
    title: "",
    companyName: "",
    location: "",
    type: "",
    description: "",
    skills: "",
    deadline: "",
    requiredSkills: "",
    requiredDegree: "",
    minGpa: ""
  };

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const token = localStorage.getItem("token");


  const validate = () => {
    const newErrors = {};
    const today = new Date().toISOString().split("T")[0];

    if (!form.title.trim()) newErrors.title = "Internship title is required";
    if (!form.companyName.trim()) newErrors.companyName = "Company name is required";
    if (!form.location.trim()) newErrors.location = "Location is required";
    if (!form.type.trim()) newErrors.type = "Please select internship type";

    if (!form.description.trim()) {
      newErrors.description = "Description is required";
    } else if (form.description.trim().length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }

    if (!form.skills.trim()) newErrors.skills = "Please enter at least one skill";

    if (!form.deadline) {
      newErrors.deadline = "Deadline is required";
    } else if (form.deadline < today) {
      newErrors.deadline = "Deadline cannot be in the past";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validate()) return;

  const payload = {
    ...form,
    skills: form.skills.split(",").map((s) => s.trim()),
    requiredSkills: form.requiredSkills.split(",").map((s) => s.trim())
  };

  try {
    await axios.post("http://localhost:5000/api/internships", payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    alert("Internship added successfully");

    setForm(initialForm);
    setErrors({});
  } catch (error) {
    console.log(error);
    alert(error.response?.data?.message || "Failed to add internship");
  }
};

  return (
    <div className="page-wrapper">
      <div className="form-card">
        <div className="form-header">
          <h1>Add Internship</h1>
          <p>Publish a new internship opportunity for students.</p>
        </div>

        <form className="modern-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Internship Title</label>
            <input
              type="text"
              name="title"
              placeholder="e.g. Frontend Developer Intern"
              value={form.title}
              onChange={handleChange}
              className={errors.title ? "input-error" : ""}
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label>Company Name</label>
            <input
              type="text"
              name="companyName"
              placeholder="e.g. Linktern"
              value={form.companyName}
              onChange={handleChange}
              className={errors.companyName ? "input-error" : ""}
            />
            {errors.companyName && <span className="error-text">{errors.companyName}</span>}
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              name="location"
              placeholder="e.g. Colombo"
              value={form.location}
              onChange={handleChange}
              className={errors.location ? "input-error" : ""}
            />
            {errors.location && <span className="error-text">{errors.location}</span>}
          </div>

          <div className="form-group">
            <label>Internship Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className={errors.type ? "input-error" : ""}
            >
              <option value="">Select Type</option>
              <option value="Remote">Remote</option>
              <option value="On-site">On-site</option>
              <option value="Hybrid">Hybrid</option>
            </select>
            {errors.type && <span className="error-text">{errors.type}</span>}
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              placeholder="Write internship details..."
              value={form.description}
              onChange={handleChange}
              className={errors.description ? "input-error" : ""}
              rows="5"
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label>Skills</label>
            <input
              type="text"
              name="skills"
              placeholder="React, Node.js, MongoDB"
              value={form.skills}
              onChange={handleChange}
              className={errors.skills ? "input-error" : ""}
            />
            {errors.skills && <span className="error-text">{errors.skills}</span>}
          </div>

          <div className="form-group">
            <label>Application Deadline</label>
            <input
              type="date"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
              className={errors.deadline ? "input-error" : ""}
            />
            {errors.deadline && <span className="error-text">{errors.deadline}</span>}
          </div>

          <div className="form-group">
            <label>Required Skills (for CV filtering)</label>
            <input
              type="text"
              name="requiredSkills"
              placeholder="JavaScript, React, Node.js"
              value={form.requiredSkills}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Required Degree</label>
            <input
              type="text"
              name="requiredDegree"
              placeholder="e.g. Computer Science"
              value={form.requiredDegree}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Minimum GPA</label>
            <input
              type="number"
              name="minGpa"
              placeholder="e.g. 3.0"
              value={form.minGpa}
              onChange={handleChange}
              step="0.1"
              min="0"
              max="4"
            />
          </div>

          <button type="submit" className="submit-btn">
            Publish Internship
          </button>
        </form>
      </div>
    </div>
  );
  
}

export default AddInternship;