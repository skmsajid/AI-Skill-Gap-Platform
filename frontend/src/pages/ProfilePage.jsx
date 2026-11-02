import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Briefcase, 
  GraduationCap, 
  Phone, 
  FileText, 
  Save, 
  CheckCircle, 
  AlertCircle,
  Edit2
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';

const ProfilePage = () => {
  const { user, profile, refreshProfile } = useAuth();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    education: '',
    target_role: '',
    skills: '',
    bio: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user || profile) {
      setFormData({
        first_name: user?.first_name || profile?.first_name || '',
        last_name: user?.last_name || profile?.last_name || '',
        email: user?.email || profile?.email || '',
        phone: profile?.phone || '',
        education: profile?.education || '',
        target_role: profile?.target_role || '',
        skills: profile?.skills || '',
        bio: profile?.bio || '',
      });
    }
  }, [user, profile]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      await authAPI.updateProfile({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        education: formData.education.trim(),
        target_role: formData.target_role.trim(),
        skills: formData.skills.trim(),
        bio: formData.bio.trim(),
      });
      await refreshProfile();
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Profile update error:', err);
      const errMsg = err.response?.data?.errors?.email?.[0] || 
                     err.response?.data?.error || 
                     'Failed to update profile. Please verify your inputs.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="profile-container">
        <div className="page-header">
          <div>
            <h2>User Profile & Career Aspirations</h2>
            <p>Manage your account credentials, target roles, and professional background</p>
          </div>
          <div>
            {!isEditing ? (
              <button 
                type="button" 
                onClick={() => setIsEditing(true)} 
                className="btn btn-primary"
              >
                <Edit2 size={16} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button 
                type="button" 
                onClick={() => setIsEditing(false)} 
                className="btn btn-secondary"
              >
                Cancel Editing
              </button>
            )}
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

        <div className="profile-card">
          <form onSubmit={handleSubmit}>
            <div className="profile-avatar-row">
              <div className="profile-large-avatar">
                {formData.first_name ? formData.first_name[0].toUpperCase() : user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="profile-hero-text">
                <h3>{formData.first_name ? `${formData.first_name} ${formData.last_name}` : user?.username}</h3>
                <span className="profile-role-tag">
                  {formData.target_role || 'Aspiring Professional'}
                </span>
                <span className="profile-email-text">{user?.email || formData.email}</span>
              </div>
            </div>

            <hr className="divider" />

            <div className="form-section-title">Personal & Contact Information</div>
            <div className="form-row">
              <div className="form-group col-half">
                <label>First Name</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-group col-half">
                <label>Last Name</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group col-half">
                <label>Email Address</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-group col-half">
                <label>Phone Number</label>
                <div className="input-with-icon">
                  <Phone size={18} className="input-icon" />
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="+91 98765 43210"
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            <hr className="divider" />

            <div className="form-section-title">Career Goals & Education</div>
            <div className="form-row">
              <div className="form-group col-half">
                <label>Target Career Role</label>
                <div className="input-with-icon">
                  <Briefcase size={18} className="input-icon" />
                  <input
                    type="text"
                    name="target_role"
                    value={formData.target_role}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="e.g. Python Backend Developer"
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group col-half">
                <label>Education / Degree</label>
                <div className="input-with-icon">
                  <GraduationCap size={18} className="input-icon" />
                  <input
                    type="text"
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="e.g. B.Tech Computer Science"
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Declared Technical Skills (Comma-separated)</label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Python, Django, MySQL, Docker, React"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Professional Bio</label>
              <textarea
                name="bio"
                rows="4"
                value={formData.bio}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Tell us about your background, career aspirations, and project experiences..."
                className="form-control"
              />
            </div>

            {isEditing && (
              <div className="form-actions mt-4">
                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg" 
                  disabled={loading}
                >
                  <Save size={18} />
                  <span>{loading ? 'Saving Profile...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
