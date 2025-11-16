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
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-in">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="rounded-xl bg-gradient-to-r from-primary to-accent p-3 shadow-lg shadow-primary/30">
            <Icon className="h-7 w-7 text-white" />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 font-medium">{description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {children}
        {actionLabel && onAction && (
          <Button onClick={onAction} className="bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold">{actionLabel}</Button>
        )}
      </div>
    </div>
  );
}

export default PageHeader;

