import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Cpu, 
  FileText, 
  Briefcase, 
  Sliders, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Clock, 
  Award, 
  Sparkles, 
  Layers, 
  BookOpen, 
  TrendingUp, 
  ChevronRight,
  Info
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { resumeAPI, jobsAPI, analysisAPI } from '../api';

const SkillAnalysisPage = () => {
  const location = useLocation();
  const preselectedJobId = location.state?.selectedJobId || null;

  const [currentResume, setCurrentResume] = useState(null);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form State
  const [jobMode, setJobMode] = useState(preselectedJobId ? 'saved' : 'saved');
  const [selectedJobId, setSelectedJobId] = useState(preselectedJobId || '');
  const [customJob, setCustomJob] = useState({
    title: '',
    company: '',
    description: '',
  });
  const [threshold, setThreshold] = useState(0.70);

  // Analysis Execution State
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');
  const [progressUpdates, setProgressUpdates] = useState({});
  const [updatingProgressId, setUpdatingProgressId] = useState(null);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingInitial(true);
      try {
        const [resRes, jobsRes] = await Promise.allSettled([
          resumeAPI.getCurrent(),
          jobsAPI.getAll()
        ]);

        if (resRes.status === 'fulfilled') {
          setCurrentResume(resRes.value.data);
        }
        if (jobsRes.status === 'fulfilled') {
          setSavedJobs(jobsRes.value.data);
          if (preselectedJobId) {
            setSelectedJobId(preselectedJobId);
            setJobMode('saved');
          } else if (jobsRes.value.data.length > 0) {
            setSelectedJobId(jobsRes.value.data[0].id);
          } else {
            setJobMode('custom');
          }
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoadingInitial(false);
      }
    };

    loadInitialData();
  }, [preselectedJobId]);

  const handleRunAnalysis = async (e) => {
    e.preventDefault();
    if (!currentResume) {
      setError('You must upload an active resume before running an analysis.');
      return;
    }

    let payload = {
      similarity_threshold: parseFloat(threshold),
    };

    if (jobMode === 'saved') {
      if (!selectedJobId) {
        setError('Please select a saved job description.');
        return;
      }
      payload.job_description_id = parseInt(selectedJobId, 10);
    } else {
      if (!customJob.title.trim() || !customJob.description.trim()) {
        setError('Job title and description are required.');
        return;
      }
      if (customJob.description.trim().length < 20) {
        setError('Job description is too short. Please provide a detailed description (at least 20 characters).');
        return;
      }
      payload.job_title = customJob.title.trim();
      payload.company_name = customJob.company.trim() || 'Target Role';
      payload.job_description_text = customJob.description.trim();
    }

    setAnalyzing(true);
    setError('');
    setAnalysisResult(null);

    try {
      const response = await analysisAPI.run(payload);
      setAnalysisResult(response.data);
    } catch (err) {
      console.error('Analysis error:', err);
      let errMsg = err.response?.data?.error;
      if (!errMsg && err.response?.data?.errors) {
        const firstErr = Object.values(err.response.data.errors)[0];
        errMsg = Array.isArray(firstErr) ? firstErr[0] : String(firstErr);
      }
      if (!errMsg) {
        errMsg = err.response?.data?.message || 'Failed to complete skill gap analysis. Please try again.';
      }
      setError(errMsg);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStatusChange = async (progressId, newStatus) => {
    setUpdatingProgressId(progressId);
    try {
      await analysisAPI.updateProgress(progressId, newStatus);
      setProgressUpdates((prev) => ({ ...prev, [progressId]: newStatus }));
      if (analysisResult?.progress_items) {
        setAnalysisResult({
          ...analysisResult,
          progress_items: analysisResult.progress_items.map((item) =>
            item.id === progressId ? { ...item, status: newStatus } : item
          ),
        });
      }
    } catch (err) {
      console.error('Failed to update progress status:', err);
      setError('Failed to update skill status in database.');
    } finally {
      setUpdatingProgressId(null);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return 'var(--success-600)';
    if (score >= 50) return 'var(--warning-600)';
    return 'var(--danger-600)';
  };

  return (
    <DashboardLayout>
      <div className="analysis-page-container">
        <div className="page-header">
          <div>
            <h2>Semantic Skill Gap Analysis</h2>
            <p>
              Compare your resume competencies with target job requirements using AI extraction and calibrated similarity
            </p>
          </div>
        </div>

        {error && (
          <div className="alert-banner alert-danger mb-4">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Configuration Panel */}
        <div className="dashboard-panel mb-4">
          <div className="panel-header">
            <div className="panel-title-group">
              <Cpu size={20} className="panel-icon" />
              <h3>Analysis Configuration</h3>
            </div>
          </div>

          <div className="panel-body">
            {/* 1. Resume Verification Card */}
            <div className="input-section-card mb-4">
              <div className="section-subtitle">1. Active Resume Source</div>
              {currentResume ? (
                <div className="active-resume-box">
                  <div className="resume-icon-badge">
                    <FileText size={24} color="var(--primary-600)" />
                  </div>
                  <div className="resume-meta">
                    <h4>{currentResume.original_filename}</h4>
                    <p>
                      {currentResume.skills?.length || 0} unique technical skills extracted &bull; Uploaded {new Date(currentResume.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Link to="/resume" className="btn btn-secondary btn-sm">
                    Change Resume
                  </Link>
                </div>
              ) : (
                <div className="alert-banner alert-warning">
                  <AlertCircle size={18} />
                  <div>
                    <strong>No active resume found!</strong> Please{' '}
                    <Link to="/resume" className="alert-link">
                      upload a PDF resume
                    </Link>{' '}
                    before running the analysis.
                  </div>
                </div>
              )}
            </div>

            {/* 2. Target Job Selection Card */}
            <div className="input-section-card mb-4">
              <div className="section-subtitle">2. Target Job Description</div>

              <div className="mode-toggle-group tab-buttons mb-3">
                <button
                  type="button"
                  onClick={() => setJobMode('saved')}
                  className={`mode-toggle-btn tab-btn ${jobMode === 'saved' ? 'active' : ''}`}
                >
                  <Briefcase size={16} />
                  <span>Choose from Saved Jobs</span>
                  <span className="tab-badge">{savedJobs.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setJobMode('custom')}
                  className={`mode-toggle-btn tab-btn ${jobMode === 'custom' ? 'active' : ''}`}
                >
                  <FileText size={16} />
                  <span>Paste New Job Description</span>
                </button>
              </div>

              {jobMode === 'saved' ? (
                savedJobs.length > 0 ? (
                  <div className="form-group">
                    <label>Select Target Job Posting</label>
                    <select
                      value={selectedJobId}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                      className="form-control"
                    >
                      {savedJobs.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.job_role || job.title} — {job.company_name || job.company || 'Standard'} ({job.skills?.length || job.required_skills?.length || 0} requirements)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="empty-state py-3">
                    <p className="text-muted">No saved jobs found in your repository.</p>
                    <button
                      type="button"
                      onClick={() => setJobMode('custom')}
                      className="btn btn-secondary btn-sm mt-2"
                    >
                      Paste New Job Description Instead
                    </button>
                  </div>
                )
              ) : (
                <div className="custom-job-inputs">
                  <div className="form-row">
                    <div className="form-group col-half">
                      <label>Job Title / Role *</label>
                      <input
                        type="text"
                        value={customJob.title}
                        onChange={(e) => setCustomJob({ ...customJob, title: e.target.value })}
                        placeholder="e.g. Python Backend Developer"
                        className="form-control"
                      />
                    </div>
                    <div className="form-group col-half">
                      <label>Company Name</label>
                      <input
                        type="text"
                        value={customJob.company}
                        onChange={(e) => setCustomJob({ ...customJob, company: e.target.value })}
                        placeholder="e.g. Acme Tech (optional)"
                        className="form-control"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Job Description Requirements *</label>
                    <textarea
                      rows="6"
                      value={customJob.description}
                      onChange={(e) => setCustomJob({ ...customJob, description: e.target.value })}
                      placeholder="Paste required skills, qualifications, responsibilities..."
                      className="form-control"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Similarity Threshold Setting */}
            <div className="input-section-card mb-4">
              <div className="threshold-container">
                <div className="threshold-info">
                  <div className="threshold-title-row">
                    <Sliders size={18} />
                    <span>Semantic Similarity Threshold: <strong>{threshold}</strong></span>
                  </div>
                  <p className="text-xs text-muted">
                    Controls precision of semantic matching (e.g. "DRF" ↔ "Django REST Framework"). Incompatible technologies (MySQL vs PostgreSQL, DevOps vs OOP) are strictly rejected regardless of threshold.
                  </p>
                </div>
                <div className="threshold-slider-wrap">
                  <input
                    type="range"
                    min="0.50"
                    max="0.85"
                    step="0.05"
                    value={threshold}
                    onChange={(e) => setThreshold(parseFloat(e.target.value))}
                    className="slider-input"
                  />
                  <div className="slider-labels">
                    <span>Moderate (0.50)</span>
                    <span>Balanced (0.70)</span>
                    <span>Strict (0.85)</span>
                  </div>
                </div>
              </div>
              {analysisResult && Math.abs(analysisResult.similarity_threshold - threshold) >= 0.01 && (
                <div className="alert-banner alert-warning mt-3" style={{ padding: '0.6rem 0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Info size={16} className="flex-shrink-0" />
                  <span>
                    Threshold changed to <strong>{threshold.toFixed(2)}</strong> (current result was evaluated at <strong>{analysisResult.similarity_threshold}</strong>). Click <strong>"Execute AI Skill Gap Analysis"</strong> below to re-evaluate with the new threshold.
                  </span>
                </div>
              )}
            </div>

            {/* Run Button */}
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing || !currentResume}
              className="btn btn-primary btn-lg btn-block"
            >
              {analyzing ? (
                <>
                  <div className="spinner-sm"></div>
                  <span>Running AI Semantic Skill Matching...</span>
                </>
              ) : (
                <>
                  <Cpu size={18} />
                  <span>Execute AI Skill Gap Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Presentation */}
        {analysisResult && (
          <div className="results-container animate-fade-in">
            {/* Match Score Hero Card */}
            <div className="match-banner-card mb-4">
              <div className="match-score-radial">
                <div 
                  className="match-percentage-badge"
                  style={{ borderColor: getScoreColor(analysisResult.match_percentage) }}
                >
                  <span 
                    className="percentage-num"
                    style={{ color: getScoreColor(analysisResult.match_percentage) }}
                  >
                    {Math.round(analysisResult.match_percentage)}%
                  </span>
                  <span className="percentage-label">Match Score</span>
                </div>
              </div>

              <div className="match-banner-details">
                <div className="match-role-header">
                  <h3>{analysisResult.job_role}</h3>
                  <span className="match-company">{analysisResult.company_name || 'Target Role'}</span>
                </div>

                <p className="match-summary-text">
                  AI analysis verified <strong>{analysisResult.matched_count}</strong> matching competencies and identified <strong>{analysisResult.missing_count}</strong> skill gaps from a total of <strong>{analysisResult.total_job_skills}</strong> required skills.
                </p>

                <div className="match-stats-row">
                  <div className="stat-pill success-pill">
                    <CheckCircle size={15} />
                    <span>{analysisResult.matched_count} Matched</span>
                  </div>
                  <div className="stat-pill danger-pill">
                    <AlertCircle size={15} />
                    <span>{analysisResult.missing_count} Missing</span>
                  </div>
                  <div className="stat-pill neutral-pill">
                    <Sliders size={15} />
                    <span>Threshold: {analysisResult.similarity_threshold}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Side-by-Side: Matched Skills vs Missing Skills */}
            <div className="comparison-grid mb-4">
              {/* Matched Skills Column */}
              <div className="dashboard-panel">
                <div className="panel-header border-success">
                  <div className="panel-title-group">
                    <CheckCircle size={20} color="var(--success-600)" />
                    <h3>Matched Skills ({analysisResult.matched_skills?.length || 0})</h3>
                  </div>
                </div>

                <div className="panel-body">
                  {analysisResult.matched_skills && analysisResult.matched_skills.length > 0 ? (
                    <div className="matched-skills-table">
                      {analysisResult.matched_skills.map((item, idx) => (
                        <div key={idx} className="matched-skill-row">
                          <div className="skill-terms">
                            <span className="job-req-name">{item.job_skill_name}</span>
                            {item.resume_skill_name && item.resume_skill_name.toLowerCase() !== item.job_skill_name.toLowerCase() && (
                              <span className="resume-match-pair">
                                matched from resume: <em>"{item.resume_skill_name}"</em>
                              </span>
                            )}
                          </div>
                          <div className="similarity-badge-wrap">
                            <span 
                              className="similarity-badge"
                              title={`Calculated similarity: ${(item.similarity_score * 100).toFixed(0)}%`}
                            >
                              {Math.round(item.similarity_score * 100)}% Match
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state py-4">
                      <p className="text-muted">No overlapping skills found at this threshold.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Missing Skills Column */}
              <div className="dashboard-panel">
                <div className="panel-header border-danger">
                  <div className="panel-title-group">
                    <AlertCircle size={20} color="var(--danger-500)" />
                    <h3>Missing Skills & Recommendations ({analysisResult.missing_skills?.length || 0})</h3>
                  </div>
                </div>

                <div className="panel-body">
                  {analysisResult.missing_skills && analysisResult.missing_skills.length > 0 ? (
                    <div className="missing-skills-list">
                      {analysisResult.missing_skills.map((item, idx) => (
                        <div key={idx} className="missing-skill-item">
                          <div className="missing-skill-title">
                            <span className="missing-name">{item.skill_name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {item.best_score > 0 && (
                                <span className="similarity-badge" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                                  Best: {Math.round(item.best_score * 100)}%
                                </span>
                              )}
                              {item.importance && (
                                <span className={`importance-tag importance-${item.importance}`}>
                                  {item.importance} priority
                                </span>
                              )}
                            </div>
                          </div>
                          {item.reason && (
                            <p className="text-xs text-muted mt-1" style={{ fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Info size={13} style={{ flexShrink: 0, color: 'var(--danger-500)' }} />
                              <span>{item.reason}</span>
                            </p>
                          )}
                          {item.recommendation && (
                            <div className="missing-recommendation-box mt-2">
                              <pre className="recommendation-text">{item.recommendation}</pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state py-4">
                      <CheckCircle size={32} color="var(--success-600)" />
                      <p className="text-success mt-2">All required technical skills matched your resume!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Requirement Similarity Diagnostic Breakdown */}
            {analysisResult.skill_breakdown && analysisResult.skill_breakdown.length > 0 && (
              <div className="dashboard-panel mb-4">
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div className="panel-title-group">
                    <Sliders size={20} className="panel-icon" />
                    <h3>Requirement Similarity Diagnostic Breakdown</h3>
                  </div>
                  <span className="badge badge-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600 }}>
                    Active Threshold: {analysisResult.similarity_threshold}
                  </span>
                </div>

                <div className="panel-body">
                  <p className="text-sm text-muted mb-3">
                    Per-requirement diagnostic scores comparing each job requirement against your resume. Adjust the threshold slider above and re-run to see how classifications change across 0.50, 0.70, and 0.85.
                  </p>

                  <div className="progress-items-table">
                    {analysisResult.skill_breakdown.map((item, idx) => (
                      <div key={idx} className="progress-item-row" style={{ alignItems: 'flex-start', padding: '0.85rem 1rem' }}>
                        <div className="progress-item-info" style={{ flex: '1 1 60%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            {item.is_match ? (
                              <CheckCircle size={16} color="var(--success-600)" className="flex-shrink-0" />
                            ) : (
                              <XCircle size={16} color="var(--danger-500)" className="flex-shrink-0" />
                            )}
                            <strong style={{ fontSize: '0.95rem' }}>{item.job_skill}</strong>
                          </div>
                          <span className="progress-role-context" style={{ fontSize: '0.82rem', color: 'var(--gray-600)' }}>
                            {item.reason}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem', flex: '0 0 auto' }}>
                          <span
                            className="similarity-badge"
                            style={{
                              background: item.is_match ? 'var(--success-50, #ecfdf5)' : 'var(--danger-50, #fef2f2)',
                              color: item.is_match ? 'var(--success-700, #047857)' : 'var(--danger-700, #b91c1c)',
                              border: `1px solid ${item.is_match ? 'var(--success-200, #a7f3d0)' : 'var(--danger-200, #fecaca)'}`,
                              padding: '0.3rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                            }}
                          >
                            {Math.round(item.similarity_score * 100)}% — {item.is_match ? 'MATCH' : 'BELOW THRESHOLD'}
                          </span>
                          {item.best_resume_skill && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                              Best resume match: <em>{item.best_resume_skill}</em>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Actionable Roadmap Tracker */}
            {analysisResult.progress_items && analysisResult.progress_items.length > 0 && (
              <div className="dashboard-panel mb-4">
                <div className="panel-header">
                  <div className="panel-title-group">
                    <TrendingUp size={20} className="panel-icon" />
                    <h3>Actionable Skill Progress Tracker for {analysisResult.job_role}</h3>
                  </div>
                </div>

                <div className="panel-body">
                  <p className="text-sm text-muted mb-3">
                    Track the missing competencies directly in your database. Changes here persist in your learning roadmap:
                  </p>

                  <div className="progress-items-table">
                    {analysisResult.progress_items.map((item) => {
                      const currentStatus = progressUpdates[item.id] || item.status;
                      const isUpdating = updatingProgressId === item.id;

                      return (
                        <div key={item.id} className="progress-item-row">
                          <div className="progress-item-info">
                            <span className="progress-skill-name">{item.skill_name}</span>
                            <span className="progress-role-context">
                              Role: <strong>{analysisResult.job_role}</strong>
                            </span>
                          </div>

                          <div className="progress-status-selector">
                            {isUpdating && <div className="spinner-xs mr-2"></div>}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(item.id, 'not_started')}
                              className={`status-chip chip-not-started ${currentStatus === 'not_started' ? 'active' : ''}`}
                              disabled={isUpdating}
                            >
                              Not Started
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(item.id, 'in_progress')}
                              className={`status-chip chip-in-progress ${currentStatus === 'in_progress' ? 'active' : ''}`}
                              disabled={isUpdating}
                            >
                              In Progress
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(item.id, 'completed')}
                              className={`status-chip chip-completed ${currentStatus === 'completed' ? 'active' : ''}`}
                              disabled={isUpdating}
                            >
                              Completed
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SkillAnalysisPage;
