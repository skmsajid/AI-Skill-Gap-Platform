import React from 'react';
import { Link } from 'react-router-dom';
import { Target, User, LogOut, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { confirm } = useModal();

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Sign Out Confirmation',
      message: 'Are you sure you want to sign out of SkillBridge?',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
      icon: 'logout'
    });

    if (confirmed) {
      await logout();
    }
  };

  return (
    <header className="public-navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">
            <Target size={22} color="#ffffff" />
          </div>
          <span className="brand-name">SkillBridge</span>
        </Link>

        <div className="navbar-actions">
          {user ? (
            <div className="navbar-user-group">
              <Link to="/dashboard" className="btn btn-secondary btn-sm">
                Dashboard
              </Link>
              <button 
                type="button" 
                onClick={handleLogout} 
                className="btn btn-ghost btn-sm"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="navbar-auth-buttons">
              <Link to="/login" className="btn btn-ghost">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary">
                <span>Get Started Free</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
