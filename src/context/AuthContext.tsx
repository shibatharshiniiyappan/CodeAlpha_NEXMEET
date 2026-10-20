import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { getMe, loginUser, registerUser } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  setGuestUser: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'nexmeet_auth_token';
const GUEST_KEY = 'nexmeet_guest_profile';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      if (token) {
        try {
          const res = await getMe(token);
          setUser(res.user);
        } catch (e) {
          console.warn('Session expired or invalid, reverting to guest/unauthenticated');
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          loadGuest();
        }
      } else {
        loadGuest();
      }
      setIsLoading(false);
    }

    function loadGuest() {
      const storedGuest = localStorage.getItem(GUEST_KEY);
      if (storedGuest) {
        try {
          setUser(JSON.parse(storedGuest));
        } catch {
          // ignore
        }
      }
    }

    initAuth();
  }, [token]);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await loginUser(email, pass);
      localStorage.setItem(TOKEN_KEY, res.token);
      setToken(res.token);
      setUser(res.user);
      localStorage.removeItem(GUEST_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await registerUser(name, email, pass);
      localStorage.setItem(TOKEN_KEY, res.token);
      setToken(res.token);
      setUser(res.user);
      localStorage.removeItem(GUEST_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const setGuestUser = (name: string) => {
    const cleanName = name.trim() || 'Guest Collaborator';
    const guestUser: User = {
      id: `guest-${Math.random().toString(36).substring(2, 9)}`,
      name: cleanName,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`,
    };
    localStorage.setItem(GUEST_KEY, JSON.stringify(guestUser));
    setUser(guestUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        setGuestUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
