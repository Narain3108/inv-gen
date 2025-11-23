/**
 * Loading Spinner Component
 */

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  text,
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6 sm:h-8 sm:w-8',
    lg: 'h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 sm:gap-3 ${className}`}>
      <div className="relative">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
        {/* Glow effect in dark mode */}
        <div className="absolute inset-0 blur-xl bg-primary/20 dark:bg-primary/30 animate-pulse" />
      </div>
      {text && (
        <p className="text-xs sm:text-sm text-muted-foreground font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
