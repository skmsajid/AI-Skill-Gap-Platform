import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Trash2, 
  Calendar, 
  Building, 
  CheckCircle, 
  AlertCircle, 
  Cpu, 
  TrendingUp, 
  Clock, 
  Sliders,
  FileText
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { analysisAPI } from '../api';
import { useModal } from '../context/ModalContext';

const AnalysisDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { confirm } = useModal();

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progressUpdates, setProgressUpdates] = useState({});
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const response = await analysisAPI.getById(id);
        setAnalysis(response.data);
      } catch (err) {
        console.error('Fetch analysis detail error:', err);
        setError('Failed to load analysis details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const handleStatusChange = async (progressId, newStatus) => {
    setUpdatingId(progressId);
    try {
      await analysisAPI.updateProgress(progressId, newStatus);
      setProgressUpdates((prev) => ({ ...prev, [progressId]: newStatus }));
      if (analysis?.progress_items) {
        setAnalysis({
          ...analysis,
          progress_items: analysis.progress_items.map((item) =>
            item.id === progressId ? { ...item, status: newStatus } : item
          ),
        });
      }
    } catch (err) {
      console.error('Failed to update progress status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Analysis Report',
      message: 'Are you sure you want to permanently delete this analysis report and its recommendations? This cannot be undone.',
      confirmText: 'Delete Report',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
      icon: 'trash'
    });
    if (!confirmed) return;
    try {
      await analysisAPI.delete(id);
      navigate('/history');
    } catch (err) {
      setError('Failed to delete analysis record.');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return 'var(--success-600)';
    if (score >= 50) return 'var(--warning-600)';
    return 'var(--danger-600)';
  };

  const matchedCount = analysis?.matched_count !== undefined ? analysis.matched_count : analysis?.total_matched;
  const missingCount = analysis?.missing_count !== undefined ? analysis.missing_count : analysis?.total_missing;

  return (
    <DashboardLayout>
      <div className="analysis-detail-container">
        {/* Navigation Breadcrumb */}
        <div className="detail-top-nav">
          <Link to="/history" className="back-link">
            <ArrowLeft size={16} />
            <span>Back to Analysis History</span>
          </Link>
          <button 
            onClick={handleDelete} 
            className="btn btn-ghost btn-sm text-danger"
          >
            <Trash2 size={16} />
            <span>Delete Analysis</span>
          </button>
        </div>

        {error && (
          <div className="alert-banner alert-danger mb-4">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner"></div>
            <p className="mt-2 text-muted">Loading analysis results...</p>
          </div>
        ) : !analysis ? (
          <div className="dashboard-panel">
            <div className="empty-state py-5">
              <h3>Analysis Report Not Found</h3>
              <p>The requested historical report may have been deleted.</p>
              <Link to="/history" className="btn btn-primary mt-3">
                Return to History
              </Link>
            </div>
          </div>
        ) : (
          <div className="detail-content animate-fade-in">
            {/* Header Hero Banner */}
            <div className="match-banner-card mb-4">
              <div className="match-score-radial">
                <div 
                  className="match-percentage-badge"
                  style={{ borderColor: getScoreColor(analysis.match_percentage) }}
                >
                  <span 
                    className="percentage-num"
                    style={{ color: getScoreColor(analysis.match_percentage) }}
                  >
                    {Math.round(analysis.match_percentage)}%
                  </span>
                  <span className="percentage-label">Match Score</span>
                </div>
              </div>

              <div className="match-banner-details">
                <div className="match-role-header">
                  <h2>{analysis.job_role}</h2>
                  <span className="match-company">{analysis.company_name || 'Target Role'}</span>
                </div>

                <div className="detail-meta-row mt-2">
                  <span className="meta-item">
                    <Calendar size={14} />
                    <span>Conducted on {new Date(analysis.created_at).toLocaleString()}</span>
                  </span>
                  <span className="meta-bullet">&bull;</span>
                  <span className="meta-item">
                    <Sliders size={14} />
                    <span>Similarity Threshold: {analysis.similarity_threshold}</span>
                  </span>
                </div>

                <div className="match-stats-row mt-3">
                  <div className="stat-pill success-pill">
                    <CheckCircle size={15} />
                    <span>{matchedCount} Matched Competencies</span>
                  </div>
                  <div className="stat-pill danger-pill">
                    <AlertCircle size={15} />
                    <span>{missingCount} Missing Gaps</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Side-by-side Skills Comparison */}
            <div className="comparison-grid mb-4">
              {/* Matched Skills Card */}
              <div className="dashboard-panel">
                <div className="panel-header border-success">
                  <div className="panel-title-group">
                    <CheckCircle size={20} color="var(--success-600)" />
                    <h3>Matched Skills ({analysis.matched_skills?.length || 0})</h3>
                  </div>
                </div>

                <div className="panel-body">
                  {analysis.matched_skills && analysis.matched_skills.length > 0 ? (
                    <div className="matched-skills-table">
                      {analysis.matched_skills.map((item, idx) => (
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
                            <span className="similarity-badge">
                              {Math.round(item.similarity_score * 100)}% Match
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state py-4">
                      <p className="text-muted">No overlapping skills found for this analysis.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Missing Skills & Recommendations Card */}
              <div className="dashboard-panel">
                <div className="panel-header border-danger">
                  <div className="panel-title-group">
                    <AlertCircle size={20} color="var(--danger-500)" />
                    <h3>Missing Skills & Recommendations ({analysis.missing_skills?.length || 0})</h3>
                  </div>
                </div>

                <div className="panel-body">
                  {analysis.missing_skills && analysis.missing_skills.length > 0 ? (
                    <div className="missing-skills-list">
                      {analysis.missing_skills.map((item, idx) => (
                        <div key={idx} className="missing-skill-item">
                          <div className="missing-skill-title">
                            <span className="missing-name">{item.skill_name}</span>
                            {item.importance && (
                              <span className={`importance-tag importance-${item.importance}`}>
                                {item.importance} priority
                              </span>
                            )}
                          </div>
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
                      <p className="text-success mt-2">All required skills were present in this analysis!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Interactive Roadmap Tracker for this Analysis */}
            {analysis.progress_items && analysis.progress_items.length > 0 && (
              <div className="dashboard-panel mb-4">
                <div className="panel-header">
                  <div className="panel-title-group">
                    <TrendingUp size={20} className="panel-icon" />
                    <h3>Actionable Roadmap Tracker for this Job</h3>
                  </div>
                </div>

                <div className="panel-body">
                  <p className="text-sm text-muted mb-3">
                    Update the learning status for the skills identified in this specific gap analysis:
                  </p>

                  <div className="progress-items-table">
                    {analysis.progress_items.map((item) => {
                      const currentStatus = progressUpdates[item.id] || item.status;
                      const isUpdating = updatingId === item.id;

                      return (
                        <div key={item.id} className="progress-item-row">
                          <div className="progress-item-info">
                            <span className="progress-skill-name">{item.skill_name}</span>
                            <span className="progress-role-context">
                              Role: <strong>{analysis.job_role}</strong>
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

export default AnalysisDetailPage;
