import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";

function InternshipDetails() {
  const { id } = useParams();
  const [internship, setInternship] = useState(null);

  useEffect(() => {
    const fetchInternship = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/internships/${id}`,
        );
        setInternship(res.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchInternship();
  }, [id]);

  if (!internship) return <p>Loading...</p>;

  return (
    <div className="details-card">
      <h1>{internship.title}</h1>
      <p>
        <strong>Company:</strong>{" "}
        {internship.postedBy ? (
          <Link to={`/profile/${internship.postedBy}`}>
            {internship.companyName}
          </Link>
        ) : (
          internship.companyName
        )}
      </p>
      <p>
        <strong>Location:</strong> {internship.location}
      </p>
      <p>
        <strong>Type:</strong> {internship.type}
      </p>
      <p>
        <strong>Description:</strong> {internship.description}
      </p>
      <p>
        <strong>Skills:</strong> {internship.skills.join(", ")}
      </p>
      <p>
        <strong>Deadline:</strong>{" "}
        {new Date(internship.deadline).toLocaleDateString()}
      </p>

      <Link className="btn" to={`/apply/${internship._id}`}>
        Apply Now
      </Link>
    </div>
  );
}

export default InternshipDetails;
