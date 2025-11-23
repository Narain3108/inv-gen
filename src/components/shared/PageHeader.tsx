/**
 * Page Header Component
 */

import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: React.ReactNode;
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  children,
}: PageHeaderProps) {
  return (
    <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-top-3 duration-500 mobile-safe-top">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        {Icon && (
          <div className="hidden sm:block shrink-0 rounded-xl bg-gradient-to-r from-primary to-accent p-2.5 sm:p-3 shadow-lg shadow-primary/30 dark:shadow-primary/20">
            <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent truncate">
            {title}
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium truncate">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
        {children}
        {actionLabel && onAction && (
          <Button 
            onClick={onAction} 
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 dark:shadow-primary/20 hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold min-h-[44px] px-6"
            size="lg"
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

export default PageHeader;

