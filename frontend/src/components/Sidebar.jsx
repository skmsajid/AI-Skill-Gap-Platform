import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  Cpu, 
  History, 
  TrendingUp, 
  User, 
  LogOut,
  Target,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';

const Sidebar = ({ isOpen = false, onClose }) => {
  const { user, profile, logout } = useAuth();
  const { confirm } = useModal();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Sign Out Confirmation',
      message: 'Are you sure you want to sign out of SkillBridge? You will need to log back in to access your analyses.',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
      icon: 'logout'
    });

    if (confirmed) {
      if (onClose) onClose();
      await logout();
      navigate('/login');
    }
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/resume', label: 'Resume Profile', icon: FileText },
    { to: '/jobs', label: 'Target Jobs', icon: Briefcase },
    { to: '/analysis', label: 'Skill Gap Analysis', icon: Cpu },
    { to: '/history', label: 'Analysis History', icon: History },
    { to: '/roadmap', label: 'Learning Roadmap', icon: TrendingUp },
    { to: '/profile', label: 'User Profile', icon: User },
  ];

  return (
    <aside className={`app-sidebar ${isOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Target size={24} color="#ffffff" />
        </div>
        <div className="brand-text">
          <span className="brand-title">SkillBridge</span>
          <span className="brand-subtitle">Career Gap AI</span>
        </div>
        {/* Mobile close button */}
        {onClose && (
          <button 
            type="button"
            className="sidebar-mobile-close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Target Role Tag */}
      {profile?.target_role && (
        <div className="sidebar-target-role" title={`Active Target Goal: ${profile.target_role}`}>
          <span className="target-dot" />
          <div className="target-info">
            <span className="target-label">Career Goal</span>
            <span className="target-value">{profile.target_role}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                if (onClose) onClose();
              }}
              className={({ isActive }) => 
                isActive ? 'sidebar-link active' : 'sidebar-link'
              }
            >
              <Icon size={18} className="sidebar-icon" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.first_name ? user.first_name[0].toUpperCase() : user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="user-details">
            <span className="user-name" title={user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}>
              {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
            </span>
            <span className="user-role" title={user?.email}>{user?.email}</span>
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          className="logout-button" 
          title="Sign Out"
          type="button"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
