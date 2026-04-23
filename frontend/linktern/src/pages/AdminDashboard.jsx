import { Link } from "react-router-dom";

function AdminDashboard() {


  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Admin Control Panel</h1>
        <p>Manage the platform, courses, and internship recommendations.</p>
      </header>



      <div className="admin-actions">
        <h2>Quick Actions</h2>
        <div className="action-grid">
          <Link to="/admin-courses" className="action-card">
            <div className="action-icon">📚</div>
            <h3>Manage Courses</h3>
            <p>Add, edit, or delete recommended courses for skill gaps.</p>
          </Link>

          <Link to="/admin-roles" className="action-card">
            <div className="action-icon">🎯</div>
            <h3>Role Requirements</h3>
            <p>Define required and preferred skills for job roles.</p>
          </Link>

          <Link to="/register-admin" className="action-card">
            <div className="action-icon">👤</div>
            <h3>Add Admin</h3>
            <p>Register another administrator to the system.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
