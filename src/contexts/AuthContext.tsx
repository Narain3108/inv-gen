
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Organization } from '@/types';
import { organizationApi } from '@/lib/api/organization.api';
import { companiesApi } from '@/lib/api/companies.api';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { useCompany } from '@/hooks/useCompany';
import { OrgLoginValues, OrgSignupValues } from '@/lib/validations';

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
  logoutUser: () => void;
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
          // We could also verify user here, but if Org is invalid, User is likely invalid too
          // For now, let's just trust it if Org is valid, or we can add user verification later
          setUser(parsedUser);
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

    if (!organization && !isAuthPage && !isPublicPage) {
      // No Org -> Go to Org Login
      router.push('/auth/org-login');
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
      if (response.user.role === 'super_admin') {
        // Check if user has any companies
        try {
          const companies = await companiesApi.getAll();
          if (companies.length === 0) {
            // No companies -> Onboarding
            router.push('/onboarding');
          } else {
            // Has companies -> Admin Dashboard
            router.push('/admin/dashboard');
          }
        } catch (error) {
          console.error('Error checking companies:', error);
          // Fallback to dashboard if check fails
          router.push('/admin/dashboard');
        }
      } else {
        router.push('/invoices/dashboard');
      }
    } catch (error: any) {
      console.error('User Login Error:', error);
      throw error;
    }
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem('userData');
    localStorage.removeItem('userToken');
    clearSelectedCompany();
    router.push('/auth/login');
    toast.success('Logged out');
  };

  const logoutOrg = () => {
    logoutUser(); // Clear user first
    setOrganization(null);
    localStorage.removeItem('orgData');
    localStorage.removeItem('orgToken');
    router.push('/auth/org-login');
    toast.success('Organization session ended');
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
      logoutUser 
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
