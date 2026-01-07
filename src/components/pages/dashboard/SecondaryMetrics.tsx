/**
 * SecondaryMetrics Component
 * Displays secondary metrics cards for dashboard (Clients, Products)
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, AlertCircle } from 'lucide-react';
import { DashboardStats } from '@/hooks/useDashboardData';

interface SecondaryMetricsProps {
    stats: DashboardStats;
}

export function SecondaryMetrics({ stats }: SecondaryMetricsProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="border-2 border-primary/10 dark:border-primary/20 hover:border-primary/30 dark:hover:border-primary/40 transition-all duration-200 hover-lift">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                    <CardTitle className="text-xs sm:text-sm font-medium">Total Clients</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="text-xl sm:text-2xl font-bold">{stats.totalClients}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Active clients
                    </p>
                </CardContent>
            </Card>

            <Card className="border-2 border-primary/10 dark:border-primary/20 hover:border-primary/30 dark:hover:border-primary/40 transition-all duration-200 hover-lift">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                    <CardTitle className="text-xs sm:text-sm font-medium">Products</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="text-xl sm:text-2xl font-bold">{stats.totalProducts}</div>
                    {stats.lowStockProducts > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3 text-orange-500 dark:text-orange-400" />
                            <p className="text-xs text-orange-500 dark:text-orange-400">
                                {stats.lowStockProducts} low stock
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default SecondaryMetrics;
