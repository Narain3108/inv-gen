
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@/types';
import { authApi } from '@/lib/api/auth.api';
import { apiClient } from '@/lib/api/client';
import { usersApi } from '@/lib/api/users.api';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { useCompany } from '@/hooks/useCompany';
import { ROLES } from '@/lib/constants';
import { GoogleOAuthProvider } from '@react-oauth/google';

interface AuthContextType {
  user: User | null;
  organization?: never;
  loading: boolean;

  // User Actions
  signupUser: (data: any) => Promise<void>;
  loginUser: (email: string, password: string) => Promise<void>;
  googleLoginUser: (token: string, username?: string, name?: string) => Promise<void>;
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
      const storedToken = localStorage.getItem('userToken');

      // If we have user data but no token, clear the stale data
      if (storedUser && !storedToken) {
        console.warn('Found stale userData without token. Clearing...');
        localStorage.removeItem('userData');
        setLoading(false);
        return;
      }

      if (storedUser && storedToken) {
        try {
          // Verify user session with backend
          try {
            const freshUser = await usersApi.getMe();
            setUser(freshUser);
            // Update local storage with fresh data
            localStorage.setItem('userData', JSON.stringify(freshUser));

            // Prime CSRF token for cookie-based sessions on page load
            try {
              await apiClient.initCsrf();
            } catch (e) {
              console.warn('Failed to initialize CSRF token on page load:', e);
              // Non-fatal - will be fetched lazily on first mutating request
            }
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
      const loginResponse = await authApi.login(email, password);

      // Store the Bearer token for cross-domain API authentication
      if (loginResponse.token) {
        localStorage.setItem('userToken', loginResponse.token);
        if (loginResponse.localId) {
          localStorage.setItem('userId', loginResponse.localId);
        }
      }

      // Fetch user profile
      const freshUser = await usersApi.getMe();
      setUser(freshUser);
      localStorage.setItem('userData', JSON.stringify(freshUser));

      // Prime CSRF token for cookie-based sessions so mutating requests include it
      try {
        await apiClient.initCsrf();
      } catch (e) {
        console.error('Failed to initialize CSRF token:', e);
        // ignore failures; requests will attempt to fetch CSRF lazily
      }

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

  const googleLoginUser = async (token: string, username?: string, name?: string) => {
    try {
      const loginResponse = await authApi.googleLogin(token, username, name);

      if (loginResponse.token) {
        localStorage.setItem('userToken', loginResponse.token);
        if (loginResponse.localId) {
          localStorage.setItem('userId', loginResponse.localId);
        }
      }

      const freshUser = await usersApi.getMe();
      setUser(freshUser);
      localStorage.setItem('userData', JSON.stringify(freshUser));

      try {
        await apiClient.initCsrf();
      } catch (e) {
        console.error('Failed to initialize CSRF token:', e);
      }

      toast.success(`Welcome back, ${freshUser.name}`);

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
      console.error('Google Login Error:', error);
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
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
      <AuthContext.Provider value={{
        user,
        loading,
        signupUser,
        loginUser,
        googleLoginUser,
        logoutUser,
        logout: logoutUser,
      }}>
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
