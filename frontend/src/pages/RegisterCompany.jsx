import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function RegisterCompany() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    companyName: "",
    email: "",
    password: ""
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/register/company",
        form
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      alert("Company registered successfully");
      navigate("/");
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Company Register</h1>
        <p className="auth-subtitle">
          Create a company account to publish internships.
        </p>

        {error && <p className="message error-message">{error}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Contact Person Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter contact person name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Company Name</label>
            <input
              type="text"
              name="companyName"
              placeholder="Enter company name"
              value={form.companyName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Company Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter company email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="primary-btn">
            Register as Company
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account?</p>
          <div className="auth-links">
            <Link to="/login">Login here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterCompany;