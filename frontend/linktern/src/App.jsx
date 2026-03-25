import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Brain, CheckCircle, AlertCircle, Target, Sparkles } from 'lucide-react';

function SkillGapAnalyzer() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [result, setResult] = useState(null);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      setError('');

      const response = await axios.get('http://localhost:5000/api/roles');
      const rolesData = Array.isArray(response.data?.roles) ? response.data.roles : [];
      setRoles(rolesData);
    } catch (err) {
      console.error('Failed to fetch roles', err);
      setRoles([]);
      setError('Failed to load roles from backend.');
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();

    if (!selectedRole || !skillsInput.trim()) {
      setError('Please select a role and enter your skills.');
      return;
    }

    try {
      setAnalyzing(true);
      setError('');
      setResult(null);

      const currentSkills = skillsInput
        .split(',')
        .map((skill) => skill.trim())
        .filter((skill) => skill !== '');

      const response = await axios.post('http://localhost:5000/api/skill-gap-ai', {
        targetRole: selectedRole,
        currentSkills
      });

      setResult(response.data || null);
    } catch (err) {
      console.error('Failed to analyze skills', err);
      setError('Failed to analyze skills.');
      setResult(null);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center shadow-lg">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">Skill Gap Analyzer</h2>
          <p className="text-gray-400 text-sm">Analyze your skills against your target career role</p>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleAnalyze} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Target Role</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-accent"
          >
            <option value="" className="text-black">
              {loadingRoles ? 'Loading roles...' : 'Select your target role'}
            </option>
            {roles.map((role, index) => (
              <option key={index} value={role} className="text-black">
                {role}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Current Skills (comma separated)
          </label>
          <textarea
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            rows="5"
            placeholder="Example: HTML, CSS, JavaScript, React"
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-accent resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={analyzing}
          className="w-full md:w-auto px-6 py-3 rounded-2xl bg-secondary hover:bg-secondary/90 text-white font-semibold transition-all duration-300 shadow-lg disabled:opacity-60"
        >
          {analyzing ? 'Analyzing...' : 'Analyze Skill Gap'}
        </button>
      </form>

      {result && (
        <div className="mt-8 space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <div className="flex items-center gap-2 text-gray-300 mb-2">
                <Target className="w-4 h-4" />
                <span className="text-sm">Target Role</span>
              </div>
              <p className="text-white font-semibold">{result.targetRole || 'N/A'}</p>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <div className="flex items-center gap-2 text-gray-300 mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm">Match Score</span>
              </div>
              <p className="text-white font-semibold">{result.score ?? 0}%</p>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <div className="flex items-center gap-2 text-gray-300 mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Level</span>
              </div>
              <p className="text-white font-semibold">{result.level || 'N/A'}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <h3 className="text-lg font-semibold text-white mb-3">Matched Skills</h3>
              {(result.matchedSkills || []).length > 0 ? (
                <ul className="space-y-2">
                  {(result.matchedSkills || []).map((skill, index) => (
                    <li key={index} className="flex items-center gap-2 text-green-300">
                      <CheckCircle className="w-4 h-4" />
                      {skill}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">No matched skills found.</p>
              )}
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <h3 className="text-lg font-semibold text-white mb-3">Missing Skills</h3>
              {(result.missingSkills || []).length > 0 ? (
                <ul className="space-y-2">
                  {(result.missingSkills || []).map((skill, index) => (
                    <li key={index} className="flex items-center gap-2 text-yellow-300">
                      <AlertCircle className="w-4 h-4" />
                      {skill}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">No missing skills. Great job!</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h3 className="text-lg font-semibold text-white mb-3">Recommendations</h3>
            {(result.recommendations || []).length > 0 ? (
              <ul className="space-y-2">
                {(result.recommendations || []).map((item, index) => (
                  <li key={index} className="text-gray-300">
                    • {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No recommendations available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SkillGapAnalyzer;