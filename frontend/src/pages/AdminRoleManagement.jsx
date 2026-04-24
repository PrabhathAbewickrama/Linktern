import { useState, useEffect } from "react";
import axios from "axios";

function AdminRoleManagement() {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingReq, setEditingReq] = useState(null);
  
  const [form, setForm] = useState({
    role: "",
    skill: "",
    type: "required",
  });

  const config = {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  };

  const fetchRequirements = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/role-requirements", config);
      setRequirements(res.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load role requirements");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  const handleOpenModal = (req = null) => {
    if (req) {
      setEditingReq(req);
      setForm({
        role: req.role,
        skill: req.skill,
        type: req.type,
      });
    } else {
      setEditingReq(null);
      setForm({
        role: "",
        skill: "",
        type: "required",
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingReq) {
        await axios.put(`http://localhost:5000/api/admin/role-requirements/${editingReq._id}`, form, config);
      } else {
        await axios.post("http://localhost:5000/api/admin/role-requirements", form, config);
      }
      setShowModal(false);
      fetchRequirements();
    } catch (err) {
      alert(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this requirement?")) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/role-requirements/${id}`, config);
        fetchRequirements();
      } catch (err) {
        alert("Delete failed");
      }
    }
  };

  if (loading) return <div className="page-loading">Loading requirements...</div>;

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Role Requirement Management</h1>
        <button className="primary-btn" onClick={() => handleOpenModal()}>
          Add New Requirement
        </button>
      </div>

      {error && <p className="message error-message">{error}</p>}

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Skill</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((req) => (
              <tr key={req._id}>
                <td>{req.role}</td>
                <td>{req.skill}</td>
                <td>
                  <span className={`badge badge-${req.type}`}>
                    {req.type}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="edit-btn" onClick={() => handleOpenModal(req)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(req._id)}>Delete</button>
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
            <h2>{editingReq ? "Edit Requirement" : "Add Requirement"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Role</label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineer"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Skill</label>
                <input
                  type="text"
                  placeholder="e.g. JavaScript"
                  value={form.skill}
                  onChange={(e) => setForm({ ...form, skill: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="required">Required</option>
                  <option value="preferred">Preferred</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  {editingReq ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminRoleManagement;
