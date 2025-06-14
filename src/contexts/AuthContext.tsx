'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Loading from '../components/Loading';

type AuthContextType = {
  authToken: string | null;
  isAuthenticated: boolean;
  logout: () => void;
  refreshToken: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DJANGO_API_URL = 'http://localhost:8000';

// Fetch UUID from Django backend
const fetchUUIDFromDjango = async (): Promise<string> => {
  try {
    const response = await fetch(`${DJANGO_API_URL}/api/auth/get-device-uuid/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.uuid;
  } catch (error) {
    console.error('Failed to fetch UUID from Django:', error);
    throw error;
  }
};

// Update device activity on Django backend
const updateDeviceActivity = async (uuid: string): Promise<void> => {
  try {
    await fetch(`${DJANGO_API_URL}/api/auth/update-activity/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ uuid }),
    });
  } catch (error) {
    console.error('Failed to update device activity:', error);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getOrCreateToken = async () => {
    if (typeof window === 'undefined') return;

    try {
      // Check for token in localStorage
      let token = localStorage.getItem('authToken');
      
      // If no token exists, fetch a new UUID from Django
      if (!token) {
        token = await fetchUUIDFromDjango();
        localStorage.setItem('authToken', token);
      } else {
        // Update activity for existing token
        await updateDeviceActivity(token);
      }
      
      setAuthToken(token);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Authentication error:', error);
      // If Django is not available, we might want to handle this gracefully
      // For now, we'll clear any existing token and show the loading state
      localStorage.removeItem('authToken');
      setAuthToken(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getOrCreateToken();
  }, []);

  const refreshToken = async () => {
    try {
      setIsLoading(true);
      const newToken = await fetchUUIDFromDjango();
      localStorage.setItem('authToken', newToken);
      setAuthToken(newToken);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to refresh token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      setAuthToken(null);
      setIsAuthenticated(false);
    }
  };

  // Show loading indicator while fetching token
  if (isLoading) {
    return <Loading />;
  }

  return (
    <AuthContext.Provider value={{ authToken, isAuthenticated, logout, refreshToken }}>
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
