import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function RegisterStudent() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    verificationCode: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSendCode = async () => {
    setError("");
    setSuccess("");

    if (!form.name || !form.email || !form.password) {
      setError("Enter your name, SLIIT email, and password before requesting a code");
      return;
    }

    try {
      setIsSendingCode(true);

      const res = await axios.post(
        "http://localhost:5000/api/auth/register/student/send-code",
        {
          name: form.name,
          email: form.email,
          password: form.password
        }
      );

      setSuccess(res.data.message || "Verification code sent to your email");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send verification code");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setIsRegistering(true);

      const res = await axios.post(
        "http://localhost:5000/api/auth/register/student",
        form
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      alert("Student registered successfully");
      navigate("/");
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Student Register</h1>
        <p className="auth-subtitle">
          Register using your SLIIT email.
        </p>

        {error && <p className="message error-message">{error}</p>}
        {success && <p className="message success-message">{success}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>SLIIT Email</label>
            <input
              type="email"
              name="email"
              placeholder="example@my.sliit.lk"
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

          <div className="form-group">
            <label>Verification Code</label>
            <input
              type="text"
              name="verificationCode"
              placeholder="Enter the 6-digit code"
              value={form.verificationCode}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="button"
            className="primary-btn"
            onClick={handleSendCode}
            disabled={isSendingCode}
          >
            {isSendingCode ? "Sending Code..." : "Get Code"}
          </button>

          <button type="submit" className="primary-btn">
            {isRegistering ? "Registering..." : "Register as Student"}
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

export default RegisterStudent;
