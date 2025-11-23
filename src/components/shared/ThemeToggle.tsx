'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ThemeToggle({ className, variant = 'ghost', size = 'icon' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <Button
        variant={variant}
        size={size}
        className={cn('relative overflow-hidden', className)}
        disabled
        aria-label="Toggle theme"
      >
        <Sun className="h-5 w-5" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        'hover:scale-105 active:scale-95',
        className
      )}
      aria-label="Toggle theme"
    >
      <Sun className={cn(
        'h-5 w-5 transition-all duration-500 absolute',
        theme === 'dark' ? 'rotate-90 scale-0' : 'rotate-0 scale-100'
      )} />
      <Moon className={cn(
        'h-5 w-5 transition-all duration-500 absolute',
        theme === 'dark' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'
      )} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
