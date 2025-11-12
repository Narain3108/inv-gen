/**
 * Mobile Sidebar Component
 * Mobile navigation drawer
 */

'use client';

import React from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[280px] p-0">
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
}
