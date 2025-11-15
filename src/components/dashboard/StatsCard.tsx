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
    <Card className={cn('hover-lift transition-all duration-200', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn('h-4 w-4', iconColor)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>

      </CardContent>
    </Card>
  );
}
