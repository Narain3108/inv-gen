/**
 * Header Component
 * Responsive top header with theme toggle and mobile menu
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, Search } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  onMenuClick?: () => void;
  className?: string;
}

export function Header({ onMenuClick, className }: HeaderProps) {
  const { logout } = useAuth();

  return (
    <header className={cn(
      'sticky top-0 z-50 flex h-14 sm:h-16 items-center gap-2 sm:gap-4',
      'border-b bg-background/80 backdrop-blur-xl px-3 sm:px-6',
      'transition-all duration-300 mobile-safe-top',
      className
    )}>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden shrink-0 hover:bg-primary/10 transition-colors mr-2"
        onClick={onMenuClick}
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search Bar - Hidden on small mobile */}
      <div className="hidden sm:flex flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input 
          placeholder="Search..." 
          className="pl-10 bg-muted/30 border-border/50 focus-visible:ring-primary/50 transition-all"
        />
      </div>

      {/* Spacer for mobile */}
      <div className="flex-1 sm:hidden" />

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
        {/* Search Button - Mobile Only */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden shrink-0 hover:bg-primary/10 transition-colors"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle className="shrink-0" />

        {/* Logout */}
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="hidden sm:inline-flex gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          className="sm:hidden shrink-0 hover:bg-destructive/10 text-destructive"
          aria-label="Logout"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
