const fs = require("fs");
const path = require("path");

const CSV_PATH = path.join(__dirname, "..", "data", "role_requirements.csv");

/**
 * Synchronizes the role_requirements.csv file with the current database state.
 */
const syncRoleRequirementsCSV = async () => {
  try {
    const RoleRequirement = require("../models/RoleRequirement");
    const requirements = await RoleRequirement.find().sort({ role: 1, type: -1 });

    let csvContent = "role,skill,type\n";
    requirements.forEach((req) => {
      csvContent += `${req.role},${req.skill},${req.type}\n`;
    });

    fs.writeFileSync(CSV_PATH, csvContent);
    console.log("role_requirements.csv synchronized with database");
  } catch (error) {
    console.error("Error synchronizing role requirements CSV:", error);
  }
};

/**
 * Updates the role_requirements in the database and then syncs to CSV.
 * @param {string} role - The job title/role.
 * @param {string[]} skills - Array of all skills.
 * @param {string[]} requiredSkills - Array of required skills.
 */
const updateRoleRequirements = async (role, skills, requiredSkills) => {
  try {
    const RoleRequirement = require("../models/RoleRequirement");
    const normalizedRole = role.trim();

    // Process required skills
    if (requiredSkills && Array.isArray(requiredSkills)) {
      for (const skill of requiredSkills) {
        const normalizedSkill = skill.trim();
        if (normalizedSkill) {
          await RoleRequirement.findOneAndUpdate(
            { role: normalizedRole, skill: normalizedSkill },
            { role: normalizedRole, skill: normalizedSkill, type: "required" },
            { upsert: true }
          );
        }
      }
    }

    // Process other skills as preferred
    if (skills && Array.isArray(skills)) {
      for (const skill of skills) {
        const normalizedSkill = skill.trim();
        if (normalizedSkill) {
          // Check if it already exists as required, if so don't downgrade to preferred
          const existing = await RoleRequirement.findOne({
            role: normalizedRole,
            skill: normalizedSkill
          });
          
          if (!existing) {
            await RoleRequirement.create({
              role: normalizedRole,
              skill: normalizedSkill,
              type: "preferred"
            });
          }
        }
      }
    }

    // Sync to CSV after DB updates
    await syncRoleRequirementsCSV();
    
  } catch (error) {
    console.error("Error updating role requirements:", error);
  }
};

module.exports = { updateRoleRequirements, syncRoleRequirementsCSV };

