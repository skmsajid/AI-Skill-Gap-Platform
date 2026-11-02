import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Target, 
  FileText, 
  Cpu, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  Award,
  Zap
} from 'lucide-react';
import Navbar from '../components/Navbar';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} className="badge-icon" />
            <span>AI-Powered Career Intelligence</span>
          </div>

          <h1 className="hero-title">
            Bridge the Gap Between <br />
            <span className="text-gradient">Your Resume</span> and Your Dream Job
          </h1>

          <p className="hero-subtitle">
            Upload your resume, paste target job descriptions, and let our semantic NLP engine 
            precisely calculate your skill match percentage, identify missing competencies, 
            and generate a personalized learning roadmap.
          </p>

          <div className="hero-cta-group">
            <Link to="/register" className="btn btn-primary btn-lg">
              <span>Start Free Analysis</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              <span>Sign In to Dashboard</span>
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="hero-metrics">
            <div className="metric-item">
              <span className="metric-number">95%+</span>
              <span className="metric-label">Skill Extraction Accuracy</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-item">
              <span className="metric-number">Semantic</span>
              <span className="metric-label">NLP Similarity Matching</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-item">
              <span className="metric-number">Instant</span>
              <span className="metric-label">Learning Recommendations</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="features-section">
        <div className="section-header">
          <span className="section-tag">How It Works</span>
          <h2 className="section-title">The Complete Semester-1 Workflow</h2>
          <p className="section-desc">
            A transparent 4-step pipeline powered by Natural Language Processing and Semantic Similarity.
          </p>
        </div>

        <div className="workflow-grid">
          <div className="workflow-card">
            <div className="step-badge">01</div>
            <div className="card-icon-wrap primary">
              <FileText size={24} />
            </div>
            <h3>Upload PDF Resume</h3>
            <p>
              Upload your existing PDF resume. The system uses PyMuPDF to extract text and identifies technical skills automatically.
            </p>
          </div>

          <div className="workflow-card">
            <div className="step-badge">02</div>
            <div className="card-icon-wrap warning">
              <Layers size={24} />
            </div>
            <h3>Add Job Descriptions</h3>
            <p>
              Paste target job descriptions or save multiple roles across companies to compare readiness across different postings.
            </p>
          </div>

          <div className="workflow-card">
            <div className="step-badge">03</div>
            <div className="card-icon-wrap info">
              <Cpu size={24} />
            </div>
            <h3>Semantic AI Matching</h3>
            <p>
              Our semantic vector matching engine pairs related technologies (e.g. Django REST Framework & REST APIs) with adjustable thresholds.
            </p>
          </div>

          <div className="workflow-card">
            <div className="step-badge">04</div>
            <div className="card-icon-wrap success">
              <TrendingUp size={24} />
            </div>
            <h3>Track Career Roadmap</h3>
            <p>
              Receive prioritized study steps for missing skills and track your progress through Not Started, In Progress, and Completed.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="benefits-section">
        <div className="benefits-container">
          <div className="benefit-info">
            <span className="section-tag">Semantic Intelligence</span>
            <h2 className="benefit-title">No Hardcoded Scores. Real Mathematical Analysis.</h2>
            <p className="benefit-text">
              Traditional keyword matching fails when job descriptions use different terminology for the same core competence. SkillBridge calculates cosine similarity across skill vectors so you get a true picture of your technical readiness.
            </p>
            <ul className="benefit-list">
              <li>
                <CheckCircle size={18} className="list-icon" />
                <span>Recognizes synonymously linked frameworks and libraries</span>
              </li>
              <li>
                <CheckCircle size={18} className="list-icon" />
                <span>Generates real calculated match percentages from your actual files</span>
              </li>
              <li>
                <CheckCircle size={18} className="list-icon" />
                <span>Maintains an auditable analysis history for interview readiness</span>
              </li>
            </ul>
          </div>

          <div className="preview-card">
            <div className="preview-card-header">
              <div className="preview-dots">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
              </div>
              <span className="preview-title">Real-Time Analysis Preview</span>
            </div>
            <div className="preview-card-body">
              <div className="preview-match-row">
                <div className="preview-gauge">
                  <span className="gauge-val">78%</span>
                  <span className="gauge-lbl">Readiness</span>
                </div>
                <div className="preview-details">
                  <h4>Backend Python Developer</h4>
                  <p>Analyzed against Active Resume</p>
                </div>
              </div>
              <div className="preview-tags-group">
                <div className="tag-group-title">Matched Skills (7)</div>
                <div className="tags-flex">
                  <span className="tag-chip tag-matched">Python (100%)</span>
                  <span className="tag-chip tag-matched">Django (95%)</span>
                  <span className="tag-chip tag-matched">REST APIs (88%)</span>
                  <span className="tag-chip tag-matched">PostgreSQL</span>
                </div>
              </div>
              <div className="preview-tags-group">
                <div className="tag-group-title">Skill Gaps to Close (3)</div>
                <div className="tags-flex">
                  <span className="tag-chip tag-missing">Docker</span>
                  <span className="tag-chip tag-missing">AWS ECS</span>
                  <span className="tag-chip tag-missing">Redis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="public-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="brand-icon">
              <Target size={20} color="#ffffff" />
            </div>
            <span className="brand-name">SkillBridge</span>
          </div>
          <p className="footer-text">
            AI-Powered Skill Gap Analysis and Career Roadmap Platform &bull; Major Project Semester-1
          </p>
          <div className="footer-links">
            <Link to="/login">Sign In</Link>
            <Link to="/register">Create Account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
