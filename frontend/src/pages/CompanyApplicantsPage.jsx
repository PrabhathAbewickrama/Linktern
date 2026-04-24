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
        <div className="company-applicants-page">
            <div className="company-applicants-hero">
                <div>
                    <span className="company-applicants-eyebrow">Hiring Workspace</span>
                    <h1 className="company-applicants-heading">Company Applicant Management</h1>
                    <p className="company-applicants-subtitle">
                        Review student profiles, filter candidates quickly, and move promising
                        applicants into interview scheduling.
                    </p>
                </div>
                <Link to="/student-interviews" className="company-applicants-link">
                    Open Student Interview Portal
                </Link>
            </div>

            <FilterBar
                filters={filters}
                setFilters={setFilters}
                onFilter={handleFilter}
                onReset={handleReset}
            />

            {applicants.length === 0 ? (
                <div className="company-applicants-empty">
                    <h3>No applicants found</h3>
                    <p>Try adjusting the filters or wait for new internship applications.</p>
                </div>
            ) : (
                <div className="company-applicants-grid">
                    {applicants.map((applicant) => (
                        <ApplicantCard
                            key={applicant._id}
                            applicant={applicant}
                            onStatusChange={fetchApplicants}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default CompanyApplicantsPage;
