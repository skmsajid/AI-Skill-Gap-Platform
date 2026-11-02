import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Target, Lock, User, Mail, Briefcase, GraduationCap, AlertCircle, ArrowRight, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    target_role: '',
    education: '',
    password: '',
    confirm_password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.first_name.trim()) {
      setError('First name is required.');
      return;
    }

    if (!formData.username.trim()) {
      setError('Username is required.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email address is required.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match. Please re-enter identical passwords.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        target_role: formData.target_role.trim(),
        education: formData.education.trim(),
        password: formData.password,
        confirm_password: formData.confirm_password,
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      const resp = err.response?.data;
      let errMsg = 'Registration failed. Please review the highlighted fields.';

      if (resp?.errors) {
        const errorList = [];
        for (const [field, messages] of Object.entries(resp.errors)) {
          const fieldLabel = field.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          const msg = Array.isArray(messages) ? messages[0] : messages;
          errorList.push(`${fieldLabel}: ${msg}`);
        }
        errMsg = errorList.join(' | ');
      } else if (resp?.error) {
        errMsg = resp.error;
      } else if (typeof resp === 'string') {
        errMsg = resp;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Navbar />

      <div className="auth-card-container">
        <div className="auth-card auth-card-wide">
          <div className="auth-header">
            <div className="auth-icon-circle">
              <Target size={28} color="#4f46e5" />
            </div>
            <h2>Create Your SkillBridge Account</h2>
            <p>Start your AI-powered skill gap analysis and personalized career roadmap</p>
          </div>

          {error && (
            <div className="alert-banner alert-danger mb-4">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group col-half">
                <label htmlFor="first_name">First Name *</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="e.g. Alex"
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-group col-half">
                <label htmlFor="last_name">Last Name</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="e.g. Taylor"
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group col-half">
                <label htmlFor="username">Username *</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a unique username"
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-group col-half">
                <label htmlFor="email">Email Address *</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="alex@example.com"
                    className="form-control"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group col-half">
                <label htmlFor="target_role">Target Job Role</label>
                <div className="input-with-icon">
                  <Briefcase size={18} className="input-icon" />
                  <input
                    type="text"
                    id="target_role"
                    name="target_role"
                    value={formData.target_role}
                    onChange={handleChange}
                    placeholder="e.g. Full Stack Python Developer"
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group col-half">
                <label htmlFor="education">Education / Degree</label>
                <div className="input-with-icon">
                  <GraduationCap size={18} className="input-icon" />
                  <input
                    type="text"
                    id="education"
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    placeholder="e.g. B.Tech Computer Science"
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group col-half">
                <label htmlFor="password">Password (min 8 characters) *</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 8 characters"
                    className="form-control"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle-btn"
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group col-half">
                <label htmlFor="confirm_password">Confirm Password *</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirm_password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    className="form-control"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="password-toggle-btn"
                    tabIndex="-1"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block btn-lg mt-3" 
              disabled={loading}
            >
              {loading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Complete Registration</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
