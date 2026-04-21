import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Brain, CheckCircle, AlertCircle, Target, Sparkles, BookOpen } from 'lucide-react';

function SkillGapAnalyzer() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [cvFile, setCvFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  
  const [courseDifficulty, setCourseDifficulty] = useState('');
  const [recommendedCourses, setRecommendedCourses] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [courseError, setCourseError] = useState('');

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

    if (!selectedRole || !cvFile) {
      setError('Please select a role and upload your CV.');
      return;
    }

    if (cvFile.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }

    // 5MB limit
    if (cvFile.size > 5 * 1024 * 1024) {
      setError('File size should not exceed 5MB.');
      return;
    }

    try {
      setAnalyzing(true);
      setError('');
      setResult(null);
      setRecommendedCourses(null);
      setCourseDifficulty('');
      setCourseError('');

      const formData = new FormData();
      formData.append('targetRole', selectedRole);
      formData.append('cv', cvFile);

      const response = await axios.post('http://localhost:5000/api/skill-gap-ai', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data?.success) {
        setResult(response.data);
      } else {
        setError(response.data?.error || 'Analysis failed.');
      }
    } catch (err) {
      console.error('Failed to analyze skills', err);
      setError(err.response?.data?.error || 'Failed to analyze skills.');
      setResult(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const fetchCourses = async () => {
    if (!courseDifficulty) {
      setCourseError('Please select a difficulty validation.');
      return;
    }
    if (!result?.missingSkills || result.missingSkills.length === 0) {
      setCourseError('No missing skills to recommend courses for.');
      return;
    }
    
    try {
      setLoadingCourses(true);
      setCourseError('');
      
      const response = await axios.post('http://localhost:5000/api/course-recommendations', {
        missingSkills: result.missingSkills,
        difficulty: courseDifficulty
      });
      
      if (response.data?.success) {
        setRecommendedCourses(response.data.courses);
      } else {
        setCourseError(response.data?.error || 'Failed to fetch courses.');
      }
    } catch (err) {
      console.error('Failed to fetch courses', err);
      setCourseError(err.response?.data?.error || 'Failed to fetch course recommendations.');
    } finally {
      setLoadingCourses(false);
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
            Upload CV (PDF)
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setCvFile(e.target.files[0])}
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-white hover:file:bg-secondary/80 outline-none focus:border-accent"
          />
          <p className="mt-2 text-xs text-gray-400">
            Supported format: PDF only. Maximum file size: 5MB.
          </p>
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

          {/* COURSE RECOMMENDATION SECTION */}
          {result?.missingSkills?.length > 0 && (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-accent" />
                <h3 className="text-xl font-bold text-white">Course Recommendations for Missing Skills</h3>
              </div>
              
              {courseError && (
                <div className="mb-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-red-300 text-sm">
                  {courseError}
                </div>
              )}
              
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Select Difficulty Path</label>
                  <select
                    value={courseDifficulty}
                    onChange={(e) => setCourseDifficulty(e.target.value)}
                    className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-accent"
                  >
                    <option value="" className="text-black">Select difficulty</option>
                    <option value="low" className="text-black">Low - Beginner</option>
                    <option value="medium" className="text-black">Medium - Intermediate</option>
                    <option value="high" className="text-black">High - Advanced</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={fetchCourses}
                    disabled={loadingCourses}
                    className="w-full md:w-auto px-6 py-3 rounded-2xl bg-secondary hover:bg-secondary/90 text-white font-semibold transition-all duration-300 shadow-lg disabled:opacity-60 h-[48px]"
                  >
                    {loadingCourses ? 'Loading...' : 'Get Courses'}
                  </button>
                </div>
              </div>

              {recommendedCourses && (
                <div>
                  {recommendedCourses.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recommendedCourses.map((course, idx) => (
                        <div key={idx} className="rounded-xl bg-black/20 p-4 border border-white/5 flex flex-col h-full hover:bg-white/5 transition-colors">
                          <h4 className="text-white font-bold mb-2">{course.name}</h4>
                          <div className="text-xs text-gray-400 mb-4 flex-grow">
                            <strong className="text-gray-300">Skills Covered:</strong> {course.skills}
                          </div>
                          <div className="flex justify-between items-center mt-auto mb-3">
                            <span className="text-xs px-2 py-1 bg-white/10 rounded-md text-gray-300 capitalize">{course.difficulty}</span>
                            <span className="text-xs text-green-400 font-semibold">{course.matchConfidence}% Match</span>
                          </div>
                          {course.url && (
                            <a href={course.url} target="_blank" rel="noopener noreferrer" className="text-xs text-center block w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors mt-auto">
                              View Course
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">No courses found for the selected difficulty.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SkillGapAnalyzer;