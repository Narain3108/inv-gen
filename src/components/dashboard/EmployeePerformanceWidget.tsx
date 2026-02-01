'use client';

/**
 * EmployeePerformanceWidget - Shows current user's performance metrics
 * Uses CSS-based charts (no external dependencies)
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { analyticsApi, EmployeeMetrics } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { TrendingUp, Clock, AlertTriangle, CheckCircle, RefreshCw, User } from 'lucide-react';

interface EmployeePerformanceWidgetProps {
    companyId: string;
    userId?: string;
}

export function EmployeePerformanceWidget({ companyId, userId }: EmployeePerformanceWidgetProps) {
    const { user } = useAuth();
    const targetUserId = userId || user?.id; // Use passed userId or current user's id
    const [data, setData] = useState<EmployeeMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!targetUserId) return;

            try {
                setLoading(true);
                const result = await analyticsApi.getEmployeeMetrics(targetUserId, companyId);
                setData(result);
                setError(null);
            } catch (err) {
                console.error('Error fetching employee metrics:', err);
                setError('Failed to load performance data');
            } finally {
                setLoading(false);
            }
        };

        if (companyId && targetUserId) {
            fetchData();
        }
    }, [companyId, targetUserId]);

    if (loading) {
        return (
            <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900">
                <CardHeader className="p-4">
                    <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        My Performance
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="flex items-center justify-center h-24">
                        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error || !data) {
        return (
            <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900">
                <CardHeader className="p-4">
                    <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        My Performance
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <p className="text-sm text-muted-foreground">{error || 'No data available'}</p>
                </CardContent>
            </Card>
        );
    }

    const { summary } = data;
    const total = summary.totalAttended || 1;

    const stats = [
        {
            label: 'Total Attended',
            value: summary.totalAttended,
            icon: Clock,
            color: 'text-blue-600',
        },
        {
            label: 'On Time',
            value: summary.onTime,
            percentage: (summary.onTime / total) * 100,
            icon: CheckCircle,
            color: 'text-green-600',
            barColor: 'bg-green-500',
        },
        {
            label: 'Delayed',
            value: summary.delayed,
            percentage: (summary.delayed / total) * 100,
            icon: AlertTriangle,
            color: 'text-red-600',
            barColor: 'bg-red-500',
        },
    ];

    return (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    My Performance
                </CardTitle>

            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2 text-center">
                    {stats.map((item) => (
                        <div key={item.label} className="bg-background/50 dark:bg-muted/30 rounded-lg p-2">
                            <item.icon className={`h-4 w-4 ${item.color} mx-auto mb-1`} />
                            <div className="text-lg font-bold">{item.value}</div>
                            <div className="text-[10px] text-muted-foreground">{item.label}</div>
                        </div>
                    ))}
                </div>

                {/* Performance Score */}
                <div className="pt-2 border-t border-green-200 dark:border-green-700">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">Performance Score</span>
                        <Badge
                            className={`text-xs ${summary.onTimePercentage >= 80
                                ? 'bg-green-600'
                                : summary.onTimePercentage >= 50
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                                }`}
                        >
                            {summary.onTimePercentage}%
                        </Badge>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${summary.onTimePercentage >= 80
                                ? 'bg-green-500'
                                : summary.onTimePercentage >= 50
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                                }`}
                            style={{ width: `${summary.onTimePercentage}%` }}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
