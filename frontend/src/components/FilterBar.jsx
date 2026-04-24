import React from "react";

function FilterBar({ filters, setFilters, onFilter, onReset }) {
    return (
        <div style={styles.container}>
            <input
                type="text"
                placeholder="Skill"
                value={filters.skill}
                onChange={(e) => setFilters({ ...filters, skill: e.target.value })}
                style={styles.input}
            />

            <input
                type="text"
                placeholder="Degree"
                value={filters.degree}
                onChange={(e) => setFilters({ ...filters, degree: e.target.value })}
                style={styles.input}
            />

            <input
                type="number"
                placeholder="Min GPA"
                value={filters.minGpa}
                onChange={(e) => setFilters({ ...filters, minGpa: e.target.value })}
                style={styles.input}
            />

            <button onClick={onFilter} style={styles.filterBtn}>Filter</button>
            <button onClick={onReset} style={styles.resetBtn}>Reset</button>
        </div>
    );
}

const styles = {
    container: {
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
        marginBottom: "20px"
    },
    input: {
        padding: "10px",
        width: "180px",
        borderRadius: "8px",
        border: "1px solid #ccc"
    },
    filterBtn: {
        padding: "10px 16px",
        border: "none",
        borderRadius: "8px",
        backgroundColor: "#1f7a5c",
        color: "white",
        cursor: "pointer"
    },
    resetBtn: {
        padding: "10px 16px",
        border: "none",
        borderRadius: "8px",
        backgroundColor: "#777",
        color: "white",
        cursor: "pointer"
    }
};

export default FilterBar;