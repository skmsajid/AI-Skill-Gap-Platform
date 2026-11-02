import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Target, 
  TrendingUp, 
  FileText, 
  Briefcase, 
  Cpu, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  Plus,
  RefreshCw,
  Award,
  Calendar,
  Sparkles
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { analysisAPI, resumeAPI } from '../api';

const DashboardPage = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [currentResume, setCurrentResume] = useState(null);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [sumRes, resRes] = await Promise.allSettled([
        analysisAPI.getDashboardSummary(),
        resumeAPI.getCurrent()
      ]);

      if (sumRes.status === 'fulfilled') {
        setSummary(sumRes.value.data);
      }
      if (resRes.status === 'fulfilled') {
        setCurrentResume(resRes.value.data);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const latestAnalysis = summary?.latest_analysis;
  const recentAnalyses = summary?.recent_analyses || [];
  const progressStats = summary?.progress_stats || { not_started: 0, in_progress: 0, completed: 0, total: 0 };

  const getPercentageColor = (pct) => {
    if (pct >= 75) return 'var(--success-600)';
    if (pct >= 50) return 'var(--warning-600)';
    return 'var(--danger-600)';
  };

  const latestMatchedCount = latestAnalysis?.matched_count !== undefined 
    ? latestAnalysis.matched_count 
    : (latestAnalysis?.total_matched || 0);

  const latestMissingCount = latestAnalysis?.missing_count !== undefined 
    ? latestAnalysis.missing_count 
    : (latestAnalysis?.total_missing || 0);

  return (
    <DashboardLayout>
      <div className="dashboard-view">
        {/* Welcome Banner */}
        <div className="welcome-banner">
          <div className="welcome-text">
            <h2>Welcome back, {user?.first_name || user?.username}! 👋</h2>
            <p>
              {profile?.target_role ? (
                <>Targeting career goal: <strong>{profile.target_role}</strong></>
              ) : (
                'Set your target job role in your profile to optimize skill recommendations.'
              )}
            </p>
          </div>
          <div className="banner-actions">
            <Link to="/analysis" className="btn btn-primary">
              <Cpu size={16} />
              <span>Run AI Analysis</span>
            </Link>
            <Link to="/resume" className="btn btn-secondary">
              <FileText size={16} />
              <span>Manage Resume</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="alert-banner alert-danger mb-4">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="metrics-grid">
          {/* Latest Match Percentage Card */}
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Latest Skill Match</span>
              <div className="metric-icon-wrap" style={{ background: '#eef2ff', color: '#4f46e5' }}>
                <Award size={18} />
              </div>
            </div>
            <div className="metric-body">
              <div 
                className="metric-big-number" 
                style={{ color: latestAnalysis ? getPercentageColor(latestAnalysis.match_percentage) : 'var(--text-muted)' }}
              >
                {latestAnalysis ? `${Math.round(latestAnalysis.match_percentage)}%` : '—'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                {latestAnalysis && (
                  <span className={`metric-badge ${
                    latestAnalysis.match_percentage >= 75 ? 'badge-success' : 
                    latestAnalysis.match_percentage >= 50 ? 'badge-warning' : 'badge-danger'
                  }`}>
                    {latestAnalysis.match_percentage >= 75 ? 'High Fit' : 
                     latestAnalysis.match_percentage >= 50 ? 'Moderate Fit' : 'Developing'}
                  </span>
                )}
              </div>
              <p className="metric-subtext">
                {latestAnalysis 
                  ? `For ${latestAnalysis.job_role} at ${latestAnalysis.company_name || 'Target Role'}`
                  : 'No analysis run yet'}
              </p>
            </div>
          </div>

          {/* Matched Skills Card */}
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Matched Skills</span>
              <div className="metric-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
                <CheckCircle size={18} />
              </div>
            </div>
            <div className="metric-body">
              <div className="metric-big-number text-success">
                {latestMatchedCount}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span className="metric-badge badge-success">Passing</span>
              </div>
              <p className="metric-subtext">
                {latestAnalysis ? 'Verified competencies matching job' : 'Run analysis to calculate'}
              </p>
            </div>
          </div>

          {/* Missing Skills Card */}
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Missing Skill Gaps</span>
              <div className="metric-icon-wrap" style={{ background: '#fef2f2', color: '#dc2626' }}>
                <AlertCircle size={18} />
              </div>
            </div>
            <div className="metric-body">
              <div className="metric-big-number text-danger">
                {latestMissingCount}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span className="metric-badge badge-danger">Action Needed</span>
              </div>
              <p className="metric-subtext">
                {latestAnalysis ? 'Actionable gaps requiring learning' : 'Run analysis to identify'}
              </p>
            </div>
          </div>

          {/* Active Resume Status Card */}
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Active Resume</span>
              <div className="metric-icon-wrap" style={{ background: '#eef2ff', color: '#4f46e5' }}>
                <FileText size={18} />
              </div>
            </div>
            <div className="metric-body">
              <div className="metric-big-number text-primary">
                {currentResume ? `${currentResume.skills?.length || 0}` : '0'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span className="metric-badge badge-primary">
                  {currentResume ? 'Active Profile' : 'Upload Needed'}
                </span>
              </div>
              <p className="metric-subtext">
                {currentResume 
                  ? `${currentResume.original_filename} (${currentResume.skills?.length || 0} skills)` 
                  : 'No resume uploaded yet'}
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Section: Skill Roadmap Progress & Saved Jobs Status */}
        <div className="comparison-grid mb-4">
          {/* Roadmap Progress Summary */}
          <div className="dashboard-panel">
            <div className="panel-header">
              <div className="panel-title-group">
                <TrendingUp size={20} className="panel-icon" />
                <h3>Roadmap Learning Progress</h3>
              </div>
              <Link to="/roadmap" className="btn btn-ghost btn-sm">
                <span>View Roadmap</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="panel-body">
              {/* Stacked multi-segment career analytics bar */}
              <div className="stacked-progress-container mb-4">
                <div className="stacked-progress-bar">
                  {progressStats.total > 0 ? (
                    <>
                      <div 
                        className="stacked-progress-segment segment-completed" 
                        style={{ width: `${(progressStats.completed / progressStats.total) * 100}%` }}
                        title={`Completed: ${progressStats.completed} (${Math.round((progressStats.completed / progressStats.total) * 100)}%)`}
                      />
                      <div 
                        className="stacked-progress-segment segment-inprogress" 
                        style={{ width: `${(progressStats.in_progress / progressStats.total) * 100}%` }}
                        title={`In Progress: ${progressStats.in_progress} (${Math.round((progressStats.in_progress / progressStats.total) * 100)}%)`}
                      />
                      <div 
                        className="stacked-progress-segment segment-notstarted" 
                        style={{ width: `${(progressStats.not_started / progressStats.total) * 100}%` }}
                        title={`Not Started: ${progressStats.not_started} (${Math.round((progressStats.not_started / progressStats.total) * 100)}%)`}
                      />
                    </>
                  ) : (
                    <div className="stacked-progress-segment segment-notstarted" style={{ width: '100%', opacity: 0.5 }} />
                  )}
                </div>

                <div className="stacked-progress-legend">
                  <div className="legend-item">
                    <span className="legend-dot dot-completed"></span>
                    <span className="legend-label">Completed</span>
                    <span className="legend-count text-success">{progressStats.completed}</span>
                    <span className="legend-pct">({progressStats.total > 0 ? Math.round((progressStats.completed / progressStats.total) * 100) : 0}%)</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot dot-inprogress"></span>
                    <span className="legend-label">In Progress</span>
                    <span className="legend-count text-warning">{progressStats.in_progress}</span>
                    <span className="legend-pct">({progressStats.total > 0 ? Math.round((progressStats.in_progress / progressStats.total) * 100) : 0}%)</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot dot-notstarted"></span>
                    <span className="legend-label">Not Started</span>
                    <span className="legend-count text-muted">{progressStats.not_started}</span>
                    <span className="legend-pct">({progressStats.total > 0 ? Math.round((progressStats.not_started / progressStats.total) * 100) : 0}%)</span>
                  </div>
                </div>
              </div>

              <div className="progress-summary-bars">
                <div className="progress-stat-row mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm">Completed Competencies</span>
                    <span className="text-success font-bold text-sm">{progressStats.completed} skills</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-bar-fill high" 
                      style={{ width: `${progressStats.total > 0 ? (progressStats.completed / progressStats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="progress-stat-row mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm">In Progress</span>
                    <span className="text-warning font-bold text-sm">{progressStats.in_progress} skills</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-bar-fill medium" 
                      style={{ width: `${progressStats.total > 0 ? (progressStats.in_progress / progressStats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="progress-stat-row">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm">Not Started</span>
                    <span className="text-muted font-bold text-sm">{progressStats.not_started} skills</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-bar-fill low" 
                      style={{ width: `${progressStats.total > 0 ? (progressStats.not_started / progressStats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="panel-callout mt-4">
                <Sparkles size={18} color="var(--primary-600)" className="flex-shrink-0" />
                <span className="text-xs text-secondary">
                  Updating your learning progress automatically reflects in your career readiness score.
                </span>
              </div>
            </div>
          </div>

          {/* Target Jobs & Quick Actions */}
          <div className="dashboard-panel">
            <div className="panel-header">
              <div className="panel-title-group">
                <Briefcase size={20} className="panel-icon" />
                <h3>Target Jobs & Shortcuts</h3>
              </div>
              <Link to="/jobs" className="btn btn-ghost btn-sm">
                <span>Manage Jobs ({summary?.total_jobs || 0})</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="panel-body">
              <p className="text-sm text-secondary mb-3">
                Quick actions to optimize your job preparation workflow:
              </p>

              <div className="quick-actions-list">
                <Link to="/jobs" className="quick-action-card">
                  <div className="quick-action-icon">
                    <Plus size={18} />
                  </div>
                  <div className="quick-action-content">
                    <h4>Add New Target Job</h4>
                    <p>Paste a job posting to extract requirements and analyze gaps</p>
                  </div>
                  <ArrowRight size={16} className="quick-action-arrow" />
                </Link>

                <Link to="/resume" className="quick-action-card">
                  <div className="quick-action-icon primary-bg">
                    <FileText size={18} />
                  </div>
                  <div className="quick-action-content">
                    <h4>Update Resume PDF</h4>
                    <p>Upload a revised resume after completing roadmap items</p>
                  </div>
                  <ArrowRight size={16} className="quick-action-arrow" />
                </Link>

                <Link to="/analysis" className="quick-action-card">
                  <div className="quick-action-icon success-bg">
                    <Cpu size={18} />
                  </div>
                  <div className="quick-action-content">
                    <h4>Run Semantic Analysis</h4>
                    <p>Test compatibility against any saved job posting</p>
                  </div>
                  <ArrowRight size={16} className="quick-action-arrow" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Analyses Archive Table */}
        <div className="dashboard-panel mb-4">
          <div className="panel-header">
            <div className="panel-title-group">
              <Clock size={20} className="panel-icon" />
              <h3>Recent Gap Analyses</h3>
            </div>
            <Link to="/history" className="btn btn-ghost btn-sm">
              <span>View Full History ({summary?.total_analyses || 0})</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="panel-body">
            {recentAnalyses.length === 0 ? (
              <div className="empty-state py-4">
                <Award size={40} className="empty-icon text-muted" />
                <h4>No Gap Analyses Performed Yet</h4>
                <p>Run your first AI skill gap analysis to evaluate your resume against targeted jobs.</p>
                <Link to="/analysis" className="btn btn-primary mt-2">
                  <Cpu size={16} />
                  <span>Start First Analysis</span>
                </Link>
              </div>
            ) : (
              <div className="table-container">
                <table className="recent-analyses-table">
                  <thead>
                    <tr>
                      <th>Job Role</th>
                      <th>Company</th>
                      <th>Match Score</th>
                      <th>Breakdown</th>
                      <th>Conducted On</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAnalyses.map((item) => {
                      const matched = item.matched_count !== undefined ? item.matched_count : item.total_matched;
                      const missing = item.missing_count !== undefined ? item.missing_count : item.total_missing;

                      return (
                        <tr key={item.id}>
                          <td className="font-semibold text-primary">{item.job_role}</td>
                          <td>{item.company_name || 'Standard Role'}</td>
                          <td>
                            <span 
                              className="badge"
                              style={{ 
                                color: getPercentageColor(item.match_percentage),
                                background: item.match_percentage >= 70 ? 'var(--success-50)' : 'var(--warning-50)'
                              }}
                            >
                              {Math.round(item.match_percentage)}% Match
                            </span>
                          </td>
                          <td>
                            <span className="text-xs text-muted">
                              <strong className="text-success">{matched}</strong> matched &bull; <strong className="text-danger">{missing}</strong> missing
                            </span>
                          </td>
                          <td className="text-muted text-xs">
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                          <td className="text-right">
                            <Link to={`/history/${item.id}`} className="btn btn-ghost btn-xs">
                              <span>Report</span>
                              <ArrowRight size={13} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
