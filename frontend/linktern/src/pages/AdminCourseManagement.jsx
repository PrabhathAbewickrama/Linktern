import { useState, useEffect } from "react";
import axios from "axios";

function AdminCourseManagement() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  
  const [form, setForm] = useState({
    course_name: "",
    skills_covered: "",
    difficulty: "Low",
    link: "",
  });

  const config = {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  };

  const fetchCourses = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/courses");
      setCourses(res.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load courses");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleOpenModal = (course = null) => {
    if (course) {
      setEditingCourse(course);
      setForm({
        course_name: course.course_name,
        skills_covered: course.skills_covered,
        difficulty: course.difficulty,
        link: course.link,
      });
    } else {
      setEditingCourse(null);
      setForm({
        course_name: "",
        skills_covered: "",
        difficulty: "Low",
        link: "",
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await axios.put(`http://localhost:5000/api/admin/courses/${editingCourse._id}`, form, config);
      } else {
        await axios.post("http://localhost:5000/api/admin/courses", form, config);
      }
      setShowModal(false);
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/courses/${id}`, config);
        fetchCourses();
      } catch (err) {
        alert("Delete failed");
      }
    }
  };

  if (loading) return <div className="page-loading">Loading courses...</div>;

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Course Management</h1>
        <button className="primary-btn" onClick={() => handleOpenModal()}>
          Add New Course
        </button>
      </div>

      {error && <p className="message error-message">{error}</p>}

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Course Name</th>
              <th>Skills</th>
              <th>Difficulty</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course._id}>
                <td>
                  <a href={course.link} target="_blank" rel="noreferrer" className="table-link">
                    {course.course_name}
                  </a>
                </td>
                <td>{course.skills_covered}</td>
                <td>
                  <span className={`badge badge-${course.difficulty.toLowerCase()}`}>
                    {course.difficulty}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="edit-btn" onClick={() => handleOpenModal(course)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(course._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingCourse ? "Edit Course" : "Add Course"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Course Name</label>
                <input
                  type="text"
                  value={form.course_name}
                  onChange={(e) => setForm({ ...form, course_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Skills (comma separated)</label>
                <input
                  type="text"
                  value={form.skills_covered}
                  onChange={(e) => setForm({ ...form, skills_covered: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Difficulty</label>
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="form-group">
                <label>Link</label>
                <input
                  type="url"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  {editingCourse ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCourseManagement;
