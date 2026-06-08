import React, { useState, type ReactNode } from 'react';
import { getUserProfile } from '../lib/storage/userProfile';
import { AuthContext } from './AuthContextValue';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string | null>(() => getUserProfile().name || '学子');

  const login = (_newToken: string, newUsername: string) => {
    setUsername(newUsername);
  };

  const logout = () => {
    // No-op for guest auth
  };

  const isAuthenticated = true;
  const token = 'guest-token';

  // Keep username fresh in case it gets edited elsewhere
  React.useEffect(() => {
    const handleStorageChange = () => {
      setUsername(getUserProfile().name || '学子');
    };
    window.addEventListener('storage', handleStorageChange);
    // Periodically sync profile name
    const interval = setInterval(handleStorageChange, 1000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ token, username, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
