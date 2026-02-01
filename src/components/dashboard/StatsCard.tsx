/**
 * Stats Card Component
 * Display statistics in dashboard with trend indicators
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  description?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down';
  iconColor?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  change,
  description,
  icon: Icon,
  trend,
  iconColor = 'text-muted-foreground',
  className,
}: StatsCardProps) {
  return (
    <Card className={cn(
      'hover-lift transition-all duration-300',
      'hover:shadow-lg dark:hover:shadow-primary/20',
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
        <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">{title}</CardTitle>
        <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 shrink-0">
          <Icon className={cn('h-3 w-3 sm:h-4 sm:w-4', iconColor)} />
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-1">
        <div className="text-xl sm:text-2xl font-bold truncate">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1.5">
            {trend === 'up' ? (
              <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 dark:text-green-400" />
            ) : trend === 'down' ? (
              <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 dark:text-red-400" />
            ) : null}
            <span className={cn(
              'text-xs sm:text-sm font-medium',
              trend === 'up' ? 'text-green-500 dark:text-green-400' : trend === 'down' ? 'text-red-500 dark:text-red-400' : 'text-muted-foreground'
            )}>
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
