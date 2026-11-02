import React, { useState } from 'react';
import { Menu, X, Target } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { profile, user } = useAuth();

  return (
    <div className="app-layout">
      {/* Mobile Top Header (Visible on screens < 768px) */}
      <header className="mobile-top-header">
        <button 
          type="button"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="mobile-menu-btn"
          aria-label="Toggle navigation menu"
        >
          {mobileSidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="mobile-brand">
          <div className="mobile-brand-icon">
            <Target size={20} color="#ffffff" />
          </div>
          <span className="mobile-brand-title">SkillBridge</span>
        </div>

        <div className="mobile-user-avatar">
          {user?.first_name ? user.first_name[0].toUpperCase() : user?.username?.[0]?.toUpperCase() || 'U'}
        </div>
      </header>

      {/* Mobile Sidebar Overlay Backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="mobile-sidebar-overlay"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (with mobile open state support) */}
      <Sidebar 
        isOpen={mobileSidebarOpen} 
        onClose={() => setMobileSidebarOpen(false)} 
      />

      {/* Main Page Area */}
      <main className="app-main">
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
