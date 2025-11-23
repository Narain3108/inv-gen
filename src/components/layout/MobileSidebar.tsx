/**
 * Mobile Sidebar Component
 * Enhanced mobile navigation drawer with dark mode support
 */

'use client';

import React from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent 
        side="left" 
        className="w-[280px] sm:w-[320px] p-0 bg-sidebar dark:bg-sidebar border-r border-sidebar-border/50"
      >
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <Sidebar className="border-none" />
      </SheetContent>
    </Sheet>
  );
}
