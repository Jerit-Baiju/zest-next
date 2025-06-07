'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Loading from '../components/Loading';

type AuthContextType = {
  authToken: string | null;
  isAuthenticated: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Generate a random 16 character string token
const generateToken = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Only run on client-side
    if (typeof window !== 'undefined') {
      // Check for token in localStorage
      let token = localStorage.getItem('authToken');
      
      // If no token exists, generate a new one and save it
      if (!token) {
        token = generateToken();
        localStorage.setItem('authToken', token);
      }
      
      setAuthToken(token);
      setIsAuthenticated(true);
    }
  }, []);

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      setAuthToken(null);
      setIsAuthenticated(false);
    }
  };

  // If there's no token yet (during initial render), show loading indicator
  // This prevents the app from rendering without authentication
  if (!authToken) {
    return <Loading />;
  }

  return (
    <AuthContext.Provider value={{ authToken, isAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
