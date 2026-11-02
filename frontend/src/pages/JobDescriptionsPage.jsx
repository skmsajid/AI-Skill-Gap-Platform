import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Plus, 
  Trash2, 
  Edit3,
  Cpu, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Building,
  Layers,
  Sparkles,
  X
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { jobsAPI } from '../api';
import { useModal } from '../context/ModalContext';

const JobDescriptionsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { confirm } = useModal();

  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
  });

  const navigate = useNavigate();

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await jobsAPI.getAll();
      setJobs(response.data);
    } catch (err) {
      console.error('Fetch jobs error:', err);
      setError('Failed to load saved job descriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleOpenAddModal = () => {
    setEditingJob(null);
    setFormData({ title: '', company: '', description: '' });
    setError('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (job, e) => {
    e.stopPropagation();
    setEditingJob(job);
    setFormData({
      title: job.job_role || job.title || '',
      company: job.company_name || job.company || '',
      description: job.description || '',
    });
    setError('');
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Job title and description are required.');
      return;
    }

    if (formData.description.trim().length < 20) {
      setError('Job description must be at least 20 characters long.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (editingJob) {
        await jobsAPI.update(editingJob.id, {
          job_role: formData.title.trim(),
          company_name: formData.company.trim() || 'Standard',
          description: formData.description.trim(),
        });
        setSuccess('Job description updated and skills re-extracted successfully!');
      } else {
        await jobsAPI.create({
          job_role: formData.title.trim(),
          company_name: formData.company.trim() || 'Standard',
          description: formData.description.trim(),
        });
        setSuccess('Job description saved and skills extracted successfully!');
      }

      setFormData({ title: '', company: '', description: '' });
      setShowAddModal(false);
      setEditingJob(null);
      await fetchJobs();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Save job error:', err);
      const errMsg = err.response?.data?.errors?.description?.[0] || 
                     err.response?.data?.errors?.job_role?.[0] ||
                     err.response?.data?.error || 
                     'Failed to save job description.';
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Delete Target Job',
      message: 'Are you sure you want to delete this job description posting from your repository?',
      confirmText: 'Delete Job',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
      icon: 'trash'
    });
    if (!confirmed) return;
    try {
      await jobsAPI.delete(id);
      setSuccess('Job description deleted successfully.');
      await fetchJobs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete job description.');
    }
  };

  const handleRunAnalysis = (jobId) => {
    navigate('/analysis', { state: { selectedJobId: jobId } });
  };

  return (
    <DashboardLayout>
      <div className="jobs-container">
        <div className="page-header">
          <div>
            <h2>Target Job Descriptions</h2>
            <p>Save and manage target job postings to analyze your technical readiness</p>
          </div>
          <div>
            <button 
              onClick={handleOpenAddModal} 
              className="btn btn-primary"
            >
              <Plus size={16} />
              <span>Add Job Description</span>
            </button>
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

        {/* Add/Edit Job Modal */}
        {showAddModal && (
          <div className="modal-backdrop">
            <div className="modal-card modal-card-large">
              <div className="modal-header">
                <h3>{editingJob ? 'Edit Job Description' : 'Add New Job Description'}</h3>
                <button 
                  onClick={() => { setShowAddModal(false); setEditingJob(null); }} 
                  className="modal-close-btn"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-row">
                  <div className="form-group col-half">
                    <label>Job Title / Role *</label>
                    <div className="input-with-icon">
                      <Briefcase size={18} className="input-icon" />
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g. Senior Backend Engineer"
                        className="form-control"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group col-half">
                    <label>Company Name</label>
                    <div className="input-with-icon">
                      <Building size={18} className="input-icon" />
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="e.g. Acme Corp (optional)"
                        className="form-control"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Full Job Description Requirements *</label>
                  <textarea
                    name="description"
                    rows="8"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Paste the full job requirements, responsibilities, and required tech stack here..."
                    className="form-control"
                    required
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span className="field-hint">
                      Our AI skill extractor will automatically identify key technical requirements and skills from this text.
                    </span>
                    <span style={{ fontSize: '0.75rem', color: formData.description.length >= 20 ? '#059669' : '#d97706', fontWeight: 600 }}>
                      {formData.description.length} characters {formData.description.length < 20 ? '(min 20 required)' : '✓'}
                    </span>
                  </div>
                </div>

                <div className="modal-actions">
                  <button 
                    type="button" 
                    onClick={() => { setShowAddModal(false); setEditingJob(null); }} 
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting 
                      ? (editingJob ? 'Updating & Extracting...' : 'Saving & Extracting...') 
                      : (editingJob ? 'Update & Re-Extract Skills' : 'Save & Extract Skills')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Saved Jobs List */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner"></div>
            <p className="mt-2 text-muted">Loading target jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="dashboard-panel">
            <div className="empty-state py-5">
              <Briefcase size={48} className="empty-icon text-muted" />
              <h3>No Target Jobs Saved</h3>
              <p>Add a job posting to extract required competencies and run AI skill gap analyses.</p>
              <button 
                onClick={handleOpenAddModal} 
                className="btn btn-primary mt-3"
              >
                <Plus size={16} />
                <span>Add Your First Job</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="jobs-grid">
            {jobs.map((job) => {
              const roleTitle = job.job_role || job.title || 'Untitled Role';
              const companyName = job.company_name || job.company || 'Standard Role';
              const skillList = job.skills || job.required_skills || [];

              return (
                <div key={job.id} className="job-card">
                  <div className="job-card-header">
                    <div>
                      <h3 className="job-card-title">{roleTitle}</h3>
                      <span className="job-card-company">{companyName}</span>
                    </div>
                    <div className="job-card-actions">
                      <button 
                        onClick={(e) => handleOpenEditModal(job, e)} 
                        className="btn-icon-secondary"
                        title="Edit Job Description"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(job.id, e)} 
                        className="btn-icon-danger"
                        title="Delete Job Description"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="job-card-body">
                    <div className="job-meta-row">
                      <Calendar size={14} />
                      <span>Added {new Date(job.created_at).toLocaleDateString()}</span>
                    </div>

                    <p className="job-snippet">
                      {job.description && job.description.length > 180 
                        ? `${job.description.substring(0, 180)}...` 
                        : job.description}
                    </p>

                    <div className="job-skills-section">
                      <span className="job-skills-label">
                        Detected Technical Requirements ({skillList.length}):
                      </span>
                      <div className="skills-badge-wrap mt-2">
                        {skillList.length > 0 ? (
                          skillList.slice(0, 8).map((s, idx) => (
                            <span key={idx} className="tag-chip tag-secondary">
                              {s.skill_name || s}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted text-xs">No explicit technical skills detected</span>
                        )}
                        {skillList.length > 8 && (
                          <span className="tag-chip tag-more">
                            +{skillList.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="job-card-footer">
                    <button 
                      onClick={() => handleRunAnalysis(job.id)} 
                      className="btn btn-primary btn-block btn-sm"
                    >
                      <Cpu size={15} />
                      <span>Analyze Skill Gap</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default JobDescriptionsPage;
