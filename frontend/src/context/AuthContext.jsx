import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Set axios defaults and interceptor
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [token]);

  // Load profile on initial load or token change
  useEffect(() => {
    const loadProfile = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await axios.get('/api/auth/profile');
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      } catch (error) {
        console.error('Profile load error', error);
        // If unauthorized/token expired, clean up
        if (error.response && (error.response.status === 401 || error.response.status === 422)) {
          setToken(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [token]);

  // Login handler
  const login = async (email, password) => {
    const response = await axios.post('/api/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = response.data;
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  // Register handler
  const register = async (userData) => {
    const response = await axios.post('/api/auth/register', userData);
    return response.data;
  };

  // Logout handler
  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (e) {
      console.warn("Logout endpoint error", e);
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  const updateProfile = async (profileData) => {
    const response = await axios.put('/api/auth/profile', profileData);
    setUser(response.data.user);
    return response.data.user;
  };

  // Google OAuth Login handler
  const loginWithGoogle = async (idToken) => {
    const response = await axios.post('/api/auth/google', { id_token: idToken });
    const { token: receivedToken, user: receivedUser } = response.data;
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const value = {
    user,
    token,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
