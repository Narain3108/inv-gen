/**
 * Header Component
 * Responsive top header with theme toggle and mobile menu
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, Search, User } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface HeaderProps {
  onMenuClick?: () => void;
  className?: string;
}

export function Header({ onMenuClick, className }: HeaderProps) {
  const { logout, user } = useAuth();
  const router = useRouter();

  const getUserInitials = () => {
    if (!user) return 'U';
    if (user.name) {
      const nameParts = user.name.trim().split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return user.name.substring(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const handleProfileClick = () => {
    router.push('/invoices/profile');
  };

  return (
    <header className={cn(
      'sticky top-0 z-40 flex h-14 sm:h-16 items-center gap-2 sm:gap-4',
      'border-b bg-background/80 backdrop-blur-xl px-3 sm:px-6',
      'transition-all duration-300 mobile-safe-top',
      className
    )}>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden shrink-0 hover:bg-primary/10 transition-colors"
        onClick={onMenuClick}
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </Button>



      {/* Spacer for mobile */}
      <div className="flex-1 sm:hidden" />

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
        {/* Search Button - Mobile Only */}


        {/* Theme Toggle */}

        {/* Profile Avatar */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleProfileClick}
          className="shrink-0 hover:bg-primary/10 transition-colors"
          aria-label="Profile"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>

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
