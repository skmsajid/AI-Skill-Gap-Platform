import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  RefreshCw,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { resumeAPI } from '../api';
import { useModal } from '../context/ModalContext';

const ResumePage = () => {
  const [currentResume, setCurrentResume] = useState(null);
  const [resumeHistory, setResumeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showExtractedText, setShowExtractedText] = useState(false);
  const { confirm } = useModal();

  const fetchResumes = async () => {
    setLoading(true);
    setError('');
    try {
      const [curRes, allRes] = await Promise.allSettled([
        resumeAPI.getCurrent(),
        resumeAPI.getAll()
      ]);

      if (curRes.status === 'fulfilled') {
        setCurrentResume(curRes.value.data);
      } else {
        setCurrentResume(null);
      }

      if (allRes.status === 'fulfilled') {
        setResumeHistory(allRes.value.data);
      }
    } catch (err) {
      console.error('Fetch resume error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const validateAndSetFile = (file) => {
    if (!file) return;
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    if (!isPdf) {
      setError('Only PDF resumes are supported. Please select or drop a valid .pdf file.');
      setSelectedFile(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setError('');
    setSuccess('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  // Drag and Drop Event Handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select or drop a PDF resume file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const response = await resumeAPI.upload(formData);
      const resData = response.data?.resume || response.data;
      setSuccess('Resume uploaded and processed successfully! AI has extracted your technical skills.');
      setSelectedFile(null);
      setCurrentResume(resData);
      await fetchResumes();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Upload error:', err);
      const errMsg = err.response?.data?.error || 
                     err.response?.data?.errors?.file?.[0] ||
                     'Failed to parse resume PDF. Please ensure it is a text-based, non-scanned PDF.';
      setError(errMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: 'Delete Active Resume',
      message: 'Are you sure you want to delete this resume? Your extracted skills and profile analysis will be cleared.',
      confirmText: 'Delete Resume',
      cancelText: 'Keep Resume',
      confirmVariant: 'danger',
      icon: 'trash'
    });

    if (!confirmed) return;

    try {
      await resumeAPI.delete(id);
      setSuccess('Resume removed successfully.');
      await fetchResumes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete resume.');
    }
  };

  return (
    <DashboardLayout>
      <div className="resume-container">
        <div className="page-header">
          <div>
            <h2>Resume Management</h2>
            <p>Upload your PDF resume to extract verified technical skills and run AI gap matching</p>
          </div>
          {currentResume && (
            <div>
              <Link to="/analysis" className="btn btn-primary">
                <Cpu size={16} />
                <span>Run Analysis With Resume</span>
              </Link>
            </div>
          )}
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

        {/* Upload Form Card */}
        <div className="dashboard-panel mb-4">
          <div className="panel-header">
            <div className="panel-title-group">
              <Upload size={20} className="panel-icon" />
              <h3>{currentResume ? 'Replace Active Resume (PDF)' : 'Upload PDF Resume'}</h3>
            </div>
          </div>
          <div className="panel-body">
            <form onSubmit={handleUpload} className="upload-form">
              <div 
                className={`file-dropzone ${isDragging ? 'is-dragging' : ''}`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input 
                  type="file" 
                  id="resume-file-input"
                  accept=".pdf,application/pdf" 
                  onChange={handleFileChange} 
                  className="file-input-hidden"
                />
                <label htmlFor="resume-file-input" className="file-dropzone-label">
                  <div className={`dropzone-icon-circle ${isDragging ? 'dropzone-icon-active' : ''}`}>
                    <FileText size={34} color="var(--primary-600)" />
                  </div>
                  {selectedFile ? (
                    <div className="selected-file-info">
                      <span className="file-name">{selectedFile.name}</span>
                      <span className="file-size">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                      <span className="change-hint">Click or drop another PDF to replace</span>
                    </div>
                  ) : (
                    <div className="dropzone-text">
                      <span className="primary-text">
                        {isDragging ? 'Release to drop your resume PDF here' : 'Click to browse or drag & drop your resume PDF'}
                      </span>
                      <span className="sub-text">Supported format: Text-based PDF (Max 10MB)</span>
                    </div>
                  )}
                </label>
              </div>

              <div className="upload-actions mt-3">
                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg" 
                  disabled={uploading || !selectedFile}
                >
                  {uploading ? (
                    <>
                      <div className="spinner-sm"></div>
                      <span>Extracting Skills with PyMuPDF & NLP...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      <span>{currentResume ? 'Replace & Parse Resume' : 'Upload & Parse Resume'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Active Resume Profile Card */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner"></div>
            <p className="mt-2 text-muted">Loading resume profile...</p>
          </div>
        ) : currentResume ? (
          <div className="dashboard-panel mb-4">
            <div className="panel-header">
              <div className="panel-title-group">
                <Award size={20} className="panel-icon" />
                <h3>Active Resume: {currentResume.original_filename}</h3>
              </div>
              <div className="panel-actions">
                <span className="badge badge-success">Active Resume</span>
                <button 
                  onClick={() => handleDelete(currentResume.id)}
                  className="btn-icon-danger ml-2"
                  title="Delete Resume"
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="panel-body">
              <div className="resume-meta-bar">
                <div className="meta-stat">
                  <span className="meta-label">Uploaded On:</span>
                  <span className="meta-val">{new Date(currentResume.uploaded_at).toLocaleString()}</span>
                </div>
                <div className="meta-stat">
                  <span className="meta-label">Technical Skills Identified:</span>
                  <span className="meta-val text-primary font-bold">
                    {currentResume.skills?.length || 0} unique competencies
                  </span>
                </div>
              </div>

              {/* Skills Cloud */}
              <div className="skills-cloud-section mt-4">
                <h4 className="section-title">Verified Technical Skills Extracted</h4>
                <div className="skills-badge-wrap mt-2">
                  {currentResume.skills && currentResume.skills.length > 0 ? (
                    currentResume.skills.map((s, idx) => (
                      <span key={idx} className="skill-badge-item">
                        {s.skill_name || s}
                      </span>
                    ))
                  ) : (
                    <p className="text-muted text-sm">No technical skills detected yet.</p>
                  )}
                </div>
              </div>

              {/* Accordion for Extracted Text */}
              {currentResume.extracted_text && (
                <div className="extracted-text-section mt-4">
                  <button 
                    type="button"
                    onClick={() => setShowExtractedText(!showExtractedText)}
                    className="text-toggle-btn"
                  >
                    <span>View Extracted Plain Text ({currentResume.extracted_text.length} characters)</span>
                    {showExtractedText ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {showExtractedText && (
                    <div className="extracted-text-box mt-2">
                      <pre>{currentResume.extracted_text}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="dashboard-panel">
            <div className="empty-state py-5">
              <FileText size={48} className="empty-icon text-muted" />
              <h3>No Resume Uploaded Yet</h3>
              <p>Upload your PDF resume above to extract your technical skills and calculate compatibility with job roles.</p>
            </div>
          </div>
        )}

        {/* Upload History Archive */}
        {resumeHistory && resumeHistory.length > 0 && (
          <div className="dashboard-panel mb-4">
            <div className="panel-header">
              <div className="panel-title-group">
                <FileText size={20} className="panel-icon" />
                <h3>Resume Upload History ({resumeHistory.length})</h3>
              </div>
            </div>
            <div className="panel-body">
              <div className="table-container">
                <table className="recent-analyses-table">
                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>Skills Identified</th>
                      <th>Uploaded Date</th>
                      <th>Profile Status</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumeHistory.map((resItem) => (
                      <tr key={resItem.id}>
                        <td className="font-semibold text-primary">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={16} />
                            <span>{resItem.original_filename}</span>
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-primary">
                            {resItem.skills?.length || 0} skills
                          </span>
                        </td>
                        <td className="text-muted text-xs">
                          {new Date(resItem.uploaded_at).toLocaleString()}
                        </td>
                        <td>
                          {resItem.is_active ? (
                            <span className="badge badge-success">Active Profile</span>
                          ) : (
                            <span className="badge badge-neutral">Archived</span>
                          )}
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(resItem.id)}
                            className="btn-icon-danger"
                            title="Delete resume"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ResumePage;
