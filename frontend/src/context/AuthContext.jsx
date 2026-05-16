import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedEmail = localStorage.getItem('email');

    if (storedToken && storedEmail) {
      setToken(storedToken);
      setUserEmail(storedEmail);
    }

    setLoading(false);
  }, []);

  const login = (authToken, email) => {
    localStorage.setItem('token', authToken);
    localStorage.setItem('email', email);
    setToken(authToken);
    setUserEmail(email);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setToken(null);
    setUserEmail(null);
  };

  const isAuthenticated = Boolean(token);

  const value = {
    token,
    userEmail,
    isAuthenticated,
    loading,
    login,
    logout,
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
