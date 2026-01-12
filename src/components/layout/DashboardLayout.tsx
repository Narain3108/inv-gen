/**
 * Dashboard Layout Component
 * Mobile-first responsive layout with sidebar and header
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileSidebar } from './MobileSidebar';
import { useAuth } from '@/hooks/useAuth';
import { useAppData } from '@/contexts/AppDataContext';
import { cn } from '@/lib/utils';
import { DashboardSkeleton } from '../shared/Skeletons';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { companies, companiesLoading, companiesInitialized } = useAppData();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Force company creation if user has no companies
  useEffect(() => {
    if (authLoading || companiesLoading || !companiesInitialized) return;
    
    // If user has no companies and is not already on the onboarding page
    // AND user is not on an admin page (Super Admins manage companies differently)
    if (companies.length === 0 && !pathname.includes('/onboarding') && !pathname.startsWith('/admin')) {
      // Only redirect Super Admins to onboarding. Employees should see "No Access" or similar.
      if (user?.role === 'super_admin') {
        router.push('/onboarding');
      } else {
        // For employees with no companies, we might want to show a toast or redirect to a specific error page
        // For now, we'll just not redirect to onboarding to avoid the loop
        console.warn('Employee has no assigned companies');
      }
    }
  }, [companies, companiesLoading, companiesInitialized, pathname, router, authLoading, user]);

  if (authLoading || (user && companiesLoading && !companiesInitialized)) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
         <aside className="hidden lg:block w-64 shrink-0 border-r border-border/50">
           {/* Simple Sidebar Skeleton */}
           <div className="h-full flex flex-col p-4 space-y-4">
              <div className="h-10 w-32 bg-muted rounded animate-pulse mb-8"></div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                    <div className="h-5 w-5 bg-muted rounded-full animate-pulse"></div>
                    <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
                </div>
              ))}
           </div>
         </aside>
         <div className="flex-1 p-6">
            <DashboardSkeleton />
         </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-border/50">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar - Overlay */}
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className={cn(
          'flex-1 overflow-y-auto overflow-x-hidden',
          'bg-gradient-to-br from-background via-muted/10 to-background',
          'p-3 sm:p-4 md:p-6',
          'mobile-safe-bottom'
        )}>
          <div className="mx-auto max-w-[1600px] w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
