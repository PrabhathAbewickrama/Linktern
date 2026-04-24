import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import FilterBar from "../components/FilterBar";
import ApplicantCard from "../components/ApplicantCard";

function CompanyApplicantsPage() {
    const [applicants, setApplicants] = useState([]);
    const [filters, setFilters] = useState({
        skill: "",
        degree: "",
        minGpa: ""
    });

    const fetchApplicants = async () => {
        try {
            const response = await api.get("/applications");
            setApplicants(response.data);
        } catch (error) {
            console.error("Error fetching applicants:", error);
        }
    };

    const handleFilter = async () => {
        try {
            const response = await api.get("/applications");
            const filteredApplicants = response.data.filter((applicant) => {
                const student = applicant.studentId || {};
                const studentSkills = Array.isArray(student.skills) ? student.skills : [];
                const matchesSkill =
                    !filters.skill ||
                    studentSkills.some((item) =>
                        item.toLowerCase().includes(filters.skill.toLowerCase()),
                    );
                const matchesDegree =
                    !filters.degree ||
                    String(student.degree || "").toLowerCase() === filters.degree.toLowerCase();
                const matchesMinGpa =
                    !filters.minGpa ||
                    Number(student.gpa || 0) >= Number(filters.minGpa);

                return matchesSkill && matchesDegree && matchesMinGpa;
            });

            setApplicants(filteredApplicants);
        } catch (error) {
            console.error("Error filtering applicants:", error);
        }
    };

    const handleReset = () => {
        setFilters({
            skill: "",
            degree: "",
            minGpa: ""
        });
        fetchApplicants();
    };

    useEffect(() => {
        fetchApplicants();
    }, []);

    return (
        <div style={styles.page}>
            <h1 style={styles.heading}>Company Applicant Management</h1>
            <Link to="/student-interviews" style={styles.studentLink}>
                Open Student Interview Portal
            </Link>

            <FilterBar
                filters={filters}
                setFilters={setFilters}
                onFilter={handleFilter}
                onReset={handleReset}
            />

            {applicants.length === 0 ? (
                <p>No applicants found.</p>
            ) : (
                applicants.map((applicant) => (
                    <ApplicantCard
                        key={applicant._id}
                        applicant={applicant}
                        onStatusChange={fetchApplicants}
                    />
                ))
            )}
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        backgroundColor: "#f4f7f8",
        padding: "30px"
    },
    heading: {
        marginBottom: "20px",
        color: "#1f3b4d"
    },
    studentLink: {
        display: "inline-block",
        marginBottom: "18px",
        color: "#0d6efd",
        fontWeight: 600,
        textDecoration: "none"
    }
};

export default CompanyApplicantsPage;
