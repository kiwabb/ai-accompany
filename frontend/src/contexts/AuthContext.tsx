import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { getUserProfile } from '../lib/storage/userProfile';

interface AuthContextType {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  login: (token: string, username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
