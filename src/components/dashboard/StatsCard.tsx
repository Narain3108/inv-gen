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
      'border-2 border-black dark:border-white',
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
        <CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold truncate pr-2">{title}</CardTitle>
        <div className="p-1.5 rounded-md bg-muted/50 dark:bg-muted/20 shrink-0">
          <Icon className={cn('h-3 w-3', iconColor)} />
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-1">
        <div className="text-lg sm:text-lg md:text-xl font-bold truncate">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1.5">
            {trend === 'up' ? (
              <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 dark:text-green-400" />
            ) : trend === 'down' ? (
              <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 dark:text-red-400" />
            ) : null}
            <span className={cn(
              'text-[10px] font-medium',
              trend === 'up' ? 'text-green-500 dark:text-green-400' : trend === 'down' ? 'text-red-500 dark:text-red-400' : 'text-muted-foreground'
            )}>
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
          </div>
        )}
        {description && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
