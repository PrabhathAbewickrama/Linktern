import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { getStoredUser } from "../utils/session";
import NotificationBell from "./NotificationBell";

function Navbar() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light",
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
    window.location.reload();
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand-link">
        LINKTERN
      </Link>

      <div className="nav-links">
        {!user ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register-student">Student Register</Link>
            <Link to="/register-company">Company Register</Link>
            <Link to="/register-admin">Admin Register</Link>
          </>
        ) : (
          <>
            <Link to="/feed">Feed</Link>
            <Link to="/internships">Internships</Link>
            <Link to="/skill-gap-analyzer">Skill Gap Analyzer</Link>

            {user.role === "company" && (
              <>
                <Link to="/add">Add Internship</Link>
                <Link to="/company-applicants">Applicants</Link>
              </>
            )}

            {user.role === "student" && (
              <>
                <Link to="/saved-internships">Saved</Link>
                <Link to="/student-interviews">Interviews</Link>
              </>
            )}

            {user.role === "admin" && (
              <Link to="/admin-dashboard">Admin Dashboard</Link>
            )}

            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              <span>{theme === "dark" ? "Light" : "Dark"}</span>
            </button>

            <NotificationBell />
            <Link to="/profile">Profile</Link>
            <div className="user-info">
              {user.profilePicture && (
                <img
                  src={`http://localhost:5000${user.profilePicture}`}
                  alt="Profile"
                  className="navbar-profile-pic"
                />
              )}
              <span className="welcome-text">
                Hi, {user.username || user.name}
              </span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
