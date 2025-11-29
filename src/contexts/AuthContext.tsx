
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@/types';
import { authApi } from '@/lib/api/auth.api';
import { usersApi } from '@/lib/api/users.api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCompany } from '@/hooks/useCompany';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>; // Keep interface compatible
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { clearSelectedCompany } = useCompany();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');
      
      if (token && userId) {
        try {
          const userData = await usersApi.getById(userId);
          setUser(userData);
        } catch (error: any) {
          console.error('Failed to fetch user profile', error);
          // Clear credentials if unauthorized or forbidden
          if (error.status === 401 || error.status === 403) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userId');
            localStorage.removeItem('selected-company-storage');
          }
        }
      }
      setLoading(false);
    };
    
    initAuth();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      // Clear any existing session data first
      clearSelectedCompany();
      localStorage.removeItem('selected-company-storage');

      const response = await authApi.signup(email, password, name);
      // Store user ID for API requests
      localStorage.setItem('userId', response.uid);
      localStorage.setItem('authToken', 'dummy-token'); // We use userId for auth now
      
      // Fetch full user profile
      const userData = await usersApi.getById(response.uid);
      setUser(userData);
      
      toast.success('Account created successfully');
      // Redirect to onboarding to create a company
      router.push('/onboarding');
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Clear any existing session data first
      clearSelectedCompany();
      localStorage.removeItem('selected-company-storage');

      const response = await authApi.login(email, password);
      // Store user ID for API requests
      localStorage.setItem('userId', response.localId);
      localStorage.setItem('authToken', response.token);
      
      // Fetch full user profile
      const userData = await usersApi.getById(response.localId);
      setUser(userData);
      
      toast.success('Signed in successfully');
      router.push('/invoices/dashboard');
    } catch (error: any) {
      console.error('Signin error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    toast.error('Google Sign-In not supported in this version');
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('selected-company-storage'); // Clear persisted company
    clearSelectedCompany(); // Clear in-memory state
    setUser(null);
    router.push('/auth/login');
    toast.success('Logged out');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, logout, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
