/**
 * DashboardHeader Component
 * Header section with time filter and action buttons for dashboard
 */

'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, Download, BarChart3, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { TimeFilter } from '@/hooks/useDashboardData';

interface DashboardHeaderProps {
    companyName: string;
    timeFilter: TimeFilter;
    onTimeFilterChange: (filter: TimeFilter) => void;
    onPreviewReport: () => void;
    onExportReport: () => void;
    onRefresh: () => void;
    refreshing: boolean;
}

export function DashboardHeader({
    companyName,
    timeFilter,
    onTimeFilterChange,
    onPreviewReport,
    onExportReport,
    onRefresh,
    refreshing,
}: DashboardHeaderProps) {
    return (
        <PageHeader
            title="Dashboard"
            description={`Analytics for ${companyName}`}
        >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                {/* Time Filter */}
                <Select value={timeFilter} onValueChange={(value: TimeFilter) => onTimeFilterChange(value)}>
                    <SelectTrigger className="w-full sm:w-[160px] h-10">
                        <Calendar className="h-4 w-4 mr-2" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="quarter">This Quarter</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                </Select>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onPreviewReport}
                        className="flex-1 sm:flex-initial text-primary hover:text-primary dark:border-primary/30 dark:hover:border-primary/50 h-10"
                    >
                        <BarChart3 className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Preview</span>
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={onExportReport}
                        className="flex-1 sm:flex-initial h-10"
                    >
                        <Download className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Download PDF</span>
                        <span className="sm:hidden">Export</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onRefresh}
                        disabled={refreshing}
                        className="dark:border-primary/30 dark:hover:border-primary/50 h-10 w-10 shrink-0"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>
        </PageHeader>
    );
}

export default DashboardHeader;
