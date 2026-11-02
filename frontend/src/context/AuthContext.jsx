import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await authAPI.getProfile();
      setUser({
        id: response.data.id,
        username: response.data.username,
        email: response.data.email,
        first_name: response.data.first_name,
        last_name: response.data.last_name,
      });
      setProfile(response.data || {});

    } catch (err) {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (credentials) => {
    const response = await authAPI.login(credentials);
    setUser(response.data.user);
    if (response.data.profile) {
      setProfile(response.data.profile);
    } else {
      await checkAuth();
    }
    return response.data;
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    setUser(response.data.user);
    if (response.data.profile) {
      setProfile(response.data.profile);
    } else {
      await checkAuth();
    }
    return response.data;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, register, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
