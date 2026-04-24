import { Link } from "react-router-dom";

function InternshipCard({ internship }) {
  return (
    <div className="card">
      <h3>{internship.title}</h3>
      <p><strong>Company:</strong> {internship.companyName}</p>
      <p><strong>Location:</strong> {internship.location}</p>
      <p><strong>Type:</strong> {internship.type}</p>
      <p>
        <strong>Deadline:</strong>{" "}
        {new Date(internship.deadline).toLocaleDateString()}
      </p>
      <Link className="btn" to={`/internship/${internship._id}`}>
        View Details
      </Link>
    </div>
  );
}

export default InternshipCard;