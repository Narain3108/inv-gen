/**
 * Empty State Component
 */

import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12 md:py-16 px-4 text-center">
      {Icon && (
        <div className="mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 p-4 sm:p-5 md:p-6 border-2 border-primary/10 dark:border-primary/20">
          <Icon className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-muted-foreground" />
        </div>
      )}
      <h3 className="mb-2 sm:mb-3 text-base sm:text-lg md:text-xl font-bold text-foreground px-4">
        {title}
      </h3>
      {description && (
        <p className="mb-4 sm:mb-6 max-w-md text-xs sm:text-sm md:text-base text-muted-foreground px-4 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          className="w-full sm:w-auto min-h-[44px] px-6 sm:px-8 font-semibold"
          size="lg"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
