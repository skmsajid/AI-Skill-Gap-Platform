import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  History, 
  Trash2, 
  ArrowRight, 
  Calendar, 
  Building, 
  CheckCircle, 
  AlertCircle, 
  Cpu,
  Search,
  Award,
  Sliders
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { analysisAPI } from '../api';
import { useModal } from '../context/ModalContext';

const AnalysisHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { confirm } = useModal();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await analysisAPI.getAll();
      setHistory(response.data);
    } catch (err) {
      console.error('Fetch history error:', err);
      setError('Failed to load analysis history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    e.preventDefault();
    const confirmed = await confirm({
      title: 'Delete Analysis Record',
      message: 'Are you sure you want to permanently delete this historical analysis? This action cannot be undone.',
      confirmText: 'Delete Record',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
      icon: 'trash'
    });
    if (!confirmed) return;
    try {
      await analysisAPI.delete(id);
      setSuccess('Analysis deleted successfully.');
      await fetchHistory();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete analysis record.');
    }
  };

  const filteredHistory = history.filter((item) => {
    const q = searchTerm.toLowerCase();
    const role = (item.job_role || '').toLowerCase();
    const comp = (item.company_name || '').toLowerCase();
    return role.includes(q) || comp.includes(q);
  });

  const getScoreColor = (score) => {
    if (score >= 75) return 'var(--success-700)';
    if (score >= 50) return 'var(--warning-700)';
    return 'var(--danger-700)';
  };

  const getScoreBg = (score) => {
    if (score >= 75) return 'var(--success-50)';
    if (score >= 50) return 'var(--warning-50)';
    return 'var(--danger-50)';
  };

  return (
    <DashboardLayout>
      <div className="history-container">
        <div className="page-header">
          <div>
            <h2>Analysis History Archive</h2>
            <p>Archive of all past skill gap calculations and reports</p>
          </div>
          <div>
            <Link to="/analysis" className="btn btn-primary">
              <Cpu size={16} />
              <span>New Analysis</span>
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

        {/* Search Bar */}
        <div className="search-bar-wrap mb-4">
          <div className="input-with-icon">
            <Search size={18} className="input-icon" />
            <input
              type="text"
              placeholder="Search by job title or company name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
            />
          </div>
        </div>

        {/* History List */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner"></div>
            <p className="mt-2 text-muted">Loading history...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="dashboard-panel">
            <div className="empty-state py-5">
              <History size={48} className="empty-icon text-muted" />
              <h3>No Analysis History Found</h3>
              <p>
                {searchTerm ? 'No results matched your search term.' : 'Run your first AI skill gap analysis to start tracking historical reports.'}
              </p>
              <Link to="/analysis" className="btn btn-primary mt-3">
                Run First Analysis
              </Link>
            </div>
          </div>
        ) : (
          <div className="history-list">
            {filteredHistory.map((item) => {
              const matchedCount = item.matched_count !== undefined ? item.matched_count : item.total_matched;
              const missingCount = item.missing_count !== undefined ? item.missing_count : item.total_missing;

              return (
                <Link 
                  key={item.id} 
                  to={`/history/${item.id}`} 
                  className="history-card"
                >
                  <div className="history-card-main">
                    <div className="history-score-col">
                      <div 
                        className="history-score-badge"
                        style={{ 
                          backgroundColor: getScoreBg(item.match_percentage),
                          color: getScoreColor(item.match_percentage)
                        }}
                      >
                        <span className="history-score-val">{Math.round(item.match_percentage)}%</span>
                        <span className="history-score-lbl">Match</span>
                      </div>
                    </div>

                    <div className="history-info-col">
                      <div className="history-role-row">
                        <h3>{item.job_role}</h3>
                        {item.company_name && (
                          <span className="history-company-tag">
                            <Building size={14} />
                            <span>{item.company_name}</span>
                          </span>
                        )}
                      </div>

                      <div className="history-meta-row">
                        <span className="meta-item">
                          <Calendar size={14} />
                          <span>{new Date(item.created_at).toLocaleString()}</span>
                        </span>
                        <span className="meta-bullet">&bull;</span>
                        <span className="meta-item text-success">
                          <CheckCircle size={14} />
                          <span>{matchedCount} Matched</span>
                        </span>
                        <span className="meta-bullet">&bull;</span>
                        <span className="meta-item text-danger">
                          <AlertCircle size={14} />
                          <span>{missingCount} Missing</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="history-actions-col">
                    <button 
                      onClick={(e) => handleDelete(item.id, e)}
                      className="btn-icon-danger"
                      title="Delete Record"
                    >
                      <Trash2 size={16} />
                    </button>
                    <span className="history-view-btn">
                      <span>View Report</span>
                      <ArrowRight size={16} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AnalysisHistoryPage;
