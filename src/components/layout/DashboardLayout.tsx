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
import { Loader2 } from 'lucide-react';

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
    
    // If user has no companies and is not already on the settings page (where they can create one)
    if (companies.length === 0 && !pathname.includes('/invoices/settings')) {
      router.push('/invoices/settings');
    }
  }, [companies, companiesLoading, companiesInitialized, pathname, router, authLoading]);

  if (authLoading || (user && companiesLoading && !companiesInitialized)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
