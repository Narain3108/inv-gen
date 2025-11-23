/**
 * Dashboard Layout Component
 * Mobile-first responsive layout with sidebar and header
 */

'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileSidebar } from './MobileSidebar';
import { AppDataProvider } from '@/contexts/AppDataContext';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AppDataProvider>
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
    </AppDataProvider>
  );
}
