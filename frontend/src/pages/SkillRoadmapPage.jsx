import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Briefcase, 
  Cpu, 
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { analysisAPI } from '../api';

const SkillRoadmapPage = () => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const response = await analysisAPI.getProgress();
      setSkills(response.data);
    } catch (err) {
      console.error('Fetch progress error:', err);
      setError('Failed to load learning roadmap skills.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await analysisAPI.updateProgress(id, newStatus);
      setSkills((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
      );
      setSuccess('Skill learning status updated and saved to database.');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      console.error('Update progress error:', err);
      setError('Failed to update skill status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredSkills = skills.filter((item) => {
    if (filterStatus === 'all') return true;
    return item.status === filterStatus;
  });

  const total = skills.length;
  const completed = skills.filter((s) => s.status === 'completed').length;
  const inProgress = skills.filter((s) => s.status === 'in_progress').length;
  const notStarted = skills.filter((s) => s.status === 'not_started').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="roadmap-container">
        <div className="page-header">
          <div>
            <h2>Learning Roadmap & Skill Progress Tracker</h2>
            <p>Track your ongoing learning journey for identified missing technical skills</p>
          </div>
          <div>
            <Link to="/analysis" className="btn btn-primary">
              <Cpu size={16} />
              <span>Analyze New Role</span>
            </Link>
          </div>
        </div>

        {success && (
          <div className="alert-banner alert-success mb-4">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="alert-banner alert-danger mb-4">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Roadmap Stats Summary Cards */}
        <div className="metrics-grid mb-4">
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Overall Roadmap Completion</span>
              <div className="metric-icon-wrap" style={{ background: '#eef2ff', color: '#4f46e5' }}>
                <Sparkles size={18} />
              </div>
            </div>
            <div className="metric-body">
              <div className="metric-big-number text-primary">{completionRate}%</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span className={`metric-badge ${completionRate >= 75 ? 'badge-success' : completionRate >= 40 ? 'badge-warning' : 'badge-primary'}`}>
                  {completionRate >= 75 ? 'Ready' : completionRate >= 40 ? 'Progressing' : 'Starting'}
                </span>
              </div>
              <p className="metric-subtext">{completed} of {total} skills mastered</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">In Progress</span>
              <div className="metric-icon-wrap" style={{ background: '#fffbeb', color: '#d97706' }}>
                <Clock size={18} />
              </div>
            </div>
            <div className="metric-body">
              <div className="metric-big-number text-warning">{inProgress}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span className="metric-badge badge-warning">Active Study</span>
              </div>
              <p className="metric-subtext">Currently actively learning</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Not Started</span>
              <div className="metric-icon-wrap" style={{ background: '#f8fafc', color: '#64748b' }}>
                <AlertCircle size={18} />
              </div>
            </div>
            <div className="metric-body">
              <div className="metric-big-number text-muted">{notStarted}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span className="metric-badge badge-neutral">In Queue</span>
              </div>
              <p className="metric-subtext">Pending skills in queue</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Completed Competencies</span>
              <div className="metric-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
                <CheckCircle size={18} />
              </div>
            </div>
            <div className="metric-body">
              <div className="metric-big-number text-success">{completed}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span className="metric-badge badge-success">Verified</span>
              </div>
              <p className="metric-subtext">Ready to add to resume</p>
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div className="tab-buttons">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`tab-btn ${filterStatus === 'all' ? 'active' : ''}`}
              >
                <span>All Skills</span>
                <span className="tab-badge">{total}</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('not_started')}
                className={`tab-btn ${filterStatus === 'not_started' ? 'active' : ''}`}
              >
                <span>Not Started</span>
                <span className="tab-badge">{notStarted}</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('in_progress')}
                className={`tab-btn ${filterStatus === 'in_progress' ? 'active' : ''}`}
              >
                <span>In Progress</span>
                <span className="tab-badge">{inProgress}</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('completed')}
                className={`tab-btn ${filterStatus === 'completed' ? 'active' : ''}`}
              >
                <span>Completed</span>
                <span className="tab-badge">{completed}</span>
              </button>
            </div>
          </div>

          <div className="panel-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner"></div>
                <p className="mt-2 text-muted">Loading roadmap progress...</p>
              </div>
            ) : filteredSkills.length === 0 ? (
              <div className="empty-state py-5">
                <TrendingUp size={48} className="empty-icon text-muted" />
                <h3>No Skills in this Category</h3>
                <p>
                  Run an AI Skill Gap Analysis to generate personalized learning items from your missing competencies.
                </p>
                <Link to="/analysis" className="btn btn-primary mt-3">
                  Run Analysis
                </Link>
              </div>
            ) : (
              <div className="progress-items-table">
                {filteredSkills.map((item) => {
                  const isUpdating = updatingId === item.id;
                  return (
                    <div key={item.id} className="progress-item-row">
                      <div className="progress-item-info">
                        <span className="progress-skill-name">{item.skill_name}</span>
                        <span className="progress-role-context">
                          Target Context: <strong>{item.job_role || 'General Technical Goal'}</strong>
                        </span>
                        {item.updated_at && (
                          <span className="text-xs text-muted mt-1">
                            Last updated {new Date(item.updated_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <div className="progress-status-selector">
                        {isUpdating && <div className="spinner-xs mr-2"></div>}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(item.id, 'not_started')}
                          className={`status-chip chip-not-started ${item.status === 'not_started' ? 'active' : ''}`}
                          disabled={isUpdating}
                        >
                          Not Started
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(item.id, 'in_progress')}
                          className={`status-chip chip-in-progress ${item.status === 'in_progress' ? 'active' : ''}`}
                          disabled={isUpdating}
                        >
                          In Progress
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(item.id, 'completed')}
                          className={`status-chip chip-completed ${item.status === 'completed' ? 'active' : ''}`}
                          disabled={isUpdating}
                        >
                          Completed
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SkillRoadmapPage;
