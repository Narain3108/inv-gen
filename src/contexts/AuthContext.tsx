
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Organization } from '@/types';
import { organizationApi } from '@/lib/api/organization.api';
import { companiesApi } from '@/lib/api/companies.api';
import { usersApi } from '@/lib/api/users.api';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { useCompany } from '@/hooks/useCompany';
import { OrgLoginValues, OrgSignupValues } from '@/lib/validations';
import { ROLES } from '@/lib/constants';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  loading: boolean;
  
  // Org Actions
  loginOrg: (data: OrgLoginValues) => Promise<void>;
  signupOrg: (data: OrgSignupValues) => Promise<void>;
  logoutOrg: () => void;
  
  // User Actions
  loginUser: (email: string, password: string) => Promise<void>;
  logoutUser: (shouldRedirect?: boolean) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { clearSelectedCompany } = useCompany();

  // Initialize Auth State
  useEffect(() => {
    const initAuth = async () => {
      // 1. Check for Organization Session
      const storedOrg = localStorage.getItem('orgData');
      if (storedOrg) {
        try {
          const parsedOrg = JSON.parse(storedOrg);
          // Verify if organization still exists in backend
          try {
            await organizationApi.getOrganization(parsedOrg.id);
            setOrganization(parsedOrg);
          } catch (verifyError) {
            console.warn('Organization session invalid:', verifyError);
            localStorage.removeItem('orgData');
            localStorage.removeItem('orgToken');
            setOrganization(null);
          }
        } catch (e) {
          localStorage.removeItem('orgData');
          localStorage.removeItem('orgToken');
        }
      }

      // 2. Check for User Session
      const storedUser = localStorage.getItem('userData');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          
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

    if (!organization) {
      if (!isAuthPage && !isPublicPage) {
        // No Org -> Go to Org Login
        router.push('/auth/org-login');
      } else if (pathname === '/auth/login') {
        // If on user login but no org, redirect to org login
        router.push('/auth/org-login');
      }
    } else if (organization && !user && !pathname?.includes('/auth/login')) {
      // Org but No User -> Go to User Login
      router.push('/auth/login');
    }
  }, [organization, user, loading, pathname, router]);

  const loginOrg = async (data: OrgLoginValues) => {
    try {
      const response = await organizationApi.login(data);
      setOrganization(response.organization);
      localStorage.setItem('orgData', JSON.stringify(response.organization));
      localStorage.setItem('orgToken', response.token);
      toast.success(`Welcome to ${response.organization.name}`);
      router.push('/auth/login');
    } catch (error: any) {
      console.error('Org Login Error:', error);
      throw error;
    }
  };

  const signupOrg = async (data: OrgSignupValues) => {
    try {
      const response = await organizationApi.create(data);
      setOrganization(response.organization);
      localStorage.setItem('orgData', JSON.stringify(response.organization));
      localStorage.setItem('orgToken', response.token);
      toast.success('Organization created successfully');
      
      // Auto-login as Super Admin (User) is handled by backend returning user token too? 
      // For now, let's redirect to user login to be safe/explicit
      router.push('/auth/login');
    } catch (error: any) {
      console.error('Org Signup Error:', error);
      throw error;
    }
  };

  const loginUser = async (email: string, password: string) => {
    if (!organization) {
      toast.error('Organization session expired');
      router.push('/auth/org-login');
      return;
    }

    try {
      const response = await organizationApi.loginUser({
        email,
        password,
        orgId: organization.id
      });
      
      setUser(response.user);
      localStorage.setItem('userData', JSON.stringify(response.user));
      localStorage.setItem('userToken', response.token);
      
      toast.success(`Welcome back, ${response.user.name}`);
      
      // Role-based Redirect
      if (response.user.role === ROLES.SUPER_ADMIN) {
        // Check if user has any companies
        try {
          const companies = await companiesApi.getAll();
          if (companies.length === 0) {
            // No companies -> Onboarding
            router.push('/onboarding');
          } else {
            // Has companies -> Main Dashboard
            router.push('/invoices/dashboard');
          }
        } catch (error) {
          console.error('Error checking companies:', error);
          // Fallback to dashboard if check fails
          router.push('/invoices/dashboard');
        }
      } else {
        router.push('/invoices/dashboard');
      }
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

  const logoutOrg = () => {
    (async () => {
      // Ensure user logout clears server cookie as well
      try {
        const { authApi } = await import('@/lib/api/auth.api');
        await authApi.logout();
      } catch (e) {
        console.warn('Logout request failed:', e);
      } finally {
        logoutUser(false); // this will clear client state without redirecting
        setOrganization(null);
        localStorage.removeItem('orgData');
        localStorage.removeItem('orgToken');
        router.push('/auth/org-login');
        toast.success('Organization session ended');
      }
    })();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      organization, 
      loading, 
      loginOrg, 
      signupOrg, 
      logoutOrg, 
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
