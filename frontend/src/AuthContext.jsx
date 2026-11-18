import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  
  // Unified dark theme — no per-role class injection needed
  useEffect(() => {
    document.body.className = 'bg-navy';
  }, []);


  const login = async (username, password) => {
    try {
      const response = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const resData = await response.json();
      
      if (!response.ok) {
        throw new Error(resData.message || 'Login failed. Please check your credentials.');
      }
      
      localStorage.setItem('token', resData.token);
      localStorage.setItem('user', JSON.stringify(resData.user));
      
      setToken(resData.token);
      setUser(resData.user);
      return resData.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
