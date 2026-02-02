/**
 * SecondaryMetrics Component
 * Displays secondary metrics cards for dashboard (Clients, Products)
 * NOTE: These metrics are now integrated into the main dashboard row.
 *       This component is kept for backward compatibility but renders nothing.
 */

'use client';

import React from 'react';
import { DashboardStats } from '@/hooks/useDashboardData';

interface SecondaryMetricsProps {
    stats: DashboardStats;
}

export function SecondaryMetrics({ stats }: SecondaryMetricsProps) {
    // Integrated into main dashboard card row - render nothing
    return null;
}

export default SecondaryMetrics;

