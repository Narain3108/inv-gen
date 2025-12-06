
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@/types';
import { authApi } from '@/lib/api/auth.api';
import { usersApi } from '@/lib/api/users.api';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { useCompany } from '@/hooks/useCompany';
import { ROLES } from '@/lib/constants';

interface AuthContextType {
  user: User | null;
  organization?: never;
  loading: boolean;
  
  // User Actions
  signupUser: (data: any) => Promise<void>;
  loginUser: (email: string, password: string) => Promise<void>;
  logoutUser: (shouldRedirect?: boolean) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { clearSelectedCompany } = useCompany();

  // Initialize Auth State
  useEffect(() => {
    const initAuth = async () => {
      // Check for User Session only
      const storedUser = localStorage.getItem('userData');
      if (storedUser) {
        try {
          // Verify user session with backend
          try {
            const freshUser = await usersApi.getMe();
            setUser(freshUser);
            // Update local storage with fresh data
            localStorage.setItem('userData', JSON.stringify(freshUser));
          } catch (verifyError) {
            console.warn('User session invalid:', verifyError);
            localStorage.removeItem('userData');
            localStorage.removeItem('userToken');
            setUser(null);
          }
        } catch (e) {
          localStorage.removeItem('userData');
          localStorage.removeItem('userToken');
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  // Redirect Logic based on Auth State
  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname?.startsWith('/auth');
    const isPublicPage = pathname === '/';

    if (!user && !isAuthPage && !isPublicPage) {
      router.push('/auth/login');
    }
  }, [user, loading, pathname, router]);

  const signupUser = async (data: any) => {
    try {
      const { username, name, email, password } = data;
      await authApi.signup(email, password, name, username);

      // After signup, fetch current user
      const freshUser = await usersApi.getMe();
      setUser(freshUser);
      localStorage.setItem('userData', JSON.stringify(freshUser));
      toast.success('Account created successfully');

      // If user has no companies, send to onboarding
      try {
        const companies = await (await import('@/lib/api/companies.api')).companiesApi.getAll();
        if (companies.length === 0) {
          router.push('/onboarding');
          return;
        }
      } catch (e) {
        // ignore and fallback
      }
      router.push('/invoices/dashboard');
    } catch (error: any) {
      console.error('Signup Error:', error);
      throw error;
    }
  };

  const loginUser = async (email: string, password: string) => {
    try {
      await authApi.login(email, password);

      // Fetch user profile
      const freshUser = await usersApi.getMe();
      setUser(freshUser);
      localStorage.setItem('userData', JSON.stringify(freshUser));

      toast.success(`Welcome back, ${freshUser.name}`);

      // Role-based Redirect
      if (freshUser.role === ROLES.SUPER_ADMIN) {
        try {
          const companies = await (await import('@/lib/api/companies.api')).companiesApi.getAll();
          if (companies.length === 0) {
            router.push('/onboarding');
            return;
          }
        } catch (error) {
          console.error('Error checking companies:', error);
        }
      }
      router.push('/invoices/dashboard');
    } catch (error: any) {
      console.error('User Login Error:', error);
      throw error;
    }
  };

  const logoutUser = (shouldRedirect: boolean = true) => {
    (async () => {
      try {
        // Call backend logout to ensure server cookie is cleared
        const { authApi } = await import('@/lib/api/auth.api');
        await authApi.logout();
      } catch (e) {
        // ignore network/logout errors but continue clearing client state
        console.warn('Logout request failed:', e);
      } finally {
        setUser(null);
        localStorage.removeItem('userData');
        localStorage.removeItem('userToken');
        clearSelectedCompany();
        if (shouldRedirect) {
          router.push('/auth/login');
        }
        toast.success('Logged out');
      }
    })();
  };

  // No organization logout - single user session handled via logoutUser

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signupUser,
      loginUser, 
      logoutUser,
      logout: logoutUser,
    }}>
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
