import React from "react";

function FilterBar({ filters, setFilters, onFilter, onReset }) {
    return (
        <div className="company-filter-bar">
            <div className="company-filter-field">
                <input
                    type="text"
                    placeholder="Skill"
                    value={filters.skill}
                    onChange={(e) => setFilters({ ...filters, skill: e.target.value })}
                    className="company-filter-input"
                />
            </div>

            <div className="company-filter-field">
                <input
                    type="text"
                    placeholder="Degree"
                    value={filters.degree}
                    onChange={(e) => setFilters({ ...filters, degree: e.target.value })}
                    className="company-filter-input"
                />
            </div>

            <div className="company-filter-field">
                <input
                    type="number"
                    placeholder="Min GPA"
                    value={filters.minGpa}
                    onChange={(e) => setFilters({ ...filters, minGpa: e.target.value })}
                    className="company-filter-input"
                />
            </div>

            <div className="company-filter-actions">
                <button onClick={onFilter} className="company-filter-btn">Filter</button>
                <button onClick={onReset} className="company-reset-btn">Reset</button>
            </div>
        </div>
    );
}

export default FilterBar;
