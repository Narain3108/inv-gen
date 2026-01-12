'use client';

/**
 * ServiceOverviewWidget - Shows service status breakdown
 * Uses CSS-based charts (no external dependencies)
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { analyticsApi, DashboardAnalytics } from '@/lib/api';
import { Wrench, Clock, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

interface ServiceOverviewWidgetProps {
    companyId: string;
}

export function ServiceOverviewWidget({ companyId }: ServiceOverviewWidgetProps) {
    const [data, setData] = useState<DashboardAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const result = await analyticsApi.getDashboardAnalytics(companyId);
                setData(result);
                setError(null);
            } catch (err) {
                console.error('Error fetching service overview:', err);
                setError('Failed to load service data');
            } finally {
                setLoading(false);
            }
        };

        if (companyId) {
            fetchData();
        }
    }, [companyId]);

    if (loading) {
        return (
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                <CardHeader className="p-4">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Service Overview
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
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                <CardHeader className="p-4">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Service Overview
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <p className="text-sm text-muted-foreground">{error || 'No data available'}</p>
                </CardContent>
            </Card>
        );
    }

    const { serviceOverview } = data;
    const total = serviceOverview.total || 1;

    const stats = [
        {
            label: 'Open',
            value: serviceOverview.open,
            percentage: (serviceOverview.open / total) * 100,
            icon: Clock,
            color: 'bg-blue-500',
            textColor: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-500/10'
        },
        {
            label: 'Pending',
            value: serviceOverview.pending,
            percentage: (serviceOverview.pending / total) * 100,
            icon: AlertCircle,
            color: 'bg-amber-500',
            textColor: 'text-amber-600',
            bgColor: 'bg-amber-50 dark:bg-amber-500/10'
        },
        {
            label: 'Closed',
            value: serviceOverview.closed,
            percentage: (serviceOverview.closed / total) * 100,
            icon: CheckCircle2,
            color: 'bg-green-500',
            textColor: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-500/10'
        },
    ];

    return (
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-blue-600" />
                    Service Overview
                </CardTitle>
                <CardDescription className="text-xs">
                    {serviceOverview.total} total services
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
                {stats.map((item) => (
                    <div key={item.label} className={`p-2 rounded-lg ${item.bgColor}`}>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                                <item.icon className={`h-3.5 w-3.5 ${item.textColor}`} />
                                <span className="text-xs font-medium">{item.label}</span>
                            </div>
                            <Badge variant="outline" className={`${item.textColor} text-xs`}>
                                {item.value}
                            </Badge>
                        </div>
                        <div className="h-1.5 bg-background dark:bg-muted/30 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${item.color} transition-all duration-500 rounded-full`}
                                style={{ width: `${item.percentage}%` }}
                            />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
