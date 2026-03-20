'use client';

/**
 * SparePartRequestHistory - Displays existing spare part requests with status
 * 
 * This component shows employees the status of their previous spare part requests:
 * - Pending: Awaiting admin approval (yellow)
 * - Approved: Ready to install, shows assigned serial numbers (green)
 * - Rejected: Denied with reason (red)
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Only displays request history
 * - Open/Closed: Extensible via props, closed for modification
 */

import React from 'react';
import { Package, Clock, CheckCircle2, XCircle, Hash } from 'lucide-react';
import { SparePartRequest } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ==================== Types ====================

interface SparePartRequestHistoryProps {
    requests: SparePartRequest[];
    className?: string;
}

// ==================== Helper Functions ====================

/**
 * Get status configuration for consistent styling
 */
const getStatusConfig = (status: SparePartRequest['status']) => {
    switch (status) {
        case 'approved':
            return {
                label: 'Approved',
                icon: CheckCircle2,
                badgeClass: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400',
                containerClass: 'border-l-green-500',
            };
        case 'rejected':
            return {
                label: 'Rejected',
                icon: XCircle,
                badgeClass: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400',
                containerClass: 'border-l-red-500',
            };
        case 'pending':
        default:
            return {
                label: 'Pending',
                icon: Clock,
                badgeClass: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400',
                containerClass: 'border-l-yellow-500',
            };
    }
};

// ==================== Sub-Components ====================

interface RequestItemProps {
    request: SparePartRequest;
}

/**
 * Individual request item display
 */
function RequestItem({ request }: RequestItemProps) {
    const config = getStatusConfig(request.status);
    const StatusIcon = config.icon;

    return (
        <div
            className={cn(
                'bg-background p-3 rounded border border-l-4 transition-colors',
                config.containerClass
            )}
        >
            {/* Header: Product Name + Status Badge */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-sm truncate">
                        {request.productName}
                    </span>
                </div>
                <Badge variant="outline" className={cn('shrink-0 text-xs', config.badgeClass)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {config.label}
                </Badge>
            </div>

            {/* Details */}
            <div className="text-xs text-muted-foreground space-y-1 pl-6">
                <p>Qty: <span className="font-medium text-foreground">{request.quantity}</span></p>

                {/* Serial Numbers (Approved) */}
                {request.status === 'approved' && request.serialNumbers && request.serialNumbers.length > 0 && (
                    <div className="flex items-start gap-1">
                        <Hash className="h-3 w-3 mt-0.5 shrink-0" />
                        <span className="text-green-600 dark:text-green-400 font-mono">
                            {request.serialNumbers.join(', ')}
                        </span>
                    </div>
                )}

                {/* Rejection Reason */}
                {request.status === 'rejected' && request.rejectionReason && (
                    <p className="text-red-600 dark:text-red-400">
                        Reason: {request.rejectionReason}
                    </p>
                )}

                {/* Approved By */}
                {request.status === 'approved' && request.approvedByName && (
                    <p className="text-green-600 dark:text-green-400">
                        Approved by {request.approvedByName}
                    </p>
                )}
            </div>
        </div>
    );
}

// ==================== Main Component ====================

export function SparePartRequestHistory({ requests, className }: SparePartRequestHistoryProps) {
    if (!requests || requests.length === 0) {
        return null;
    }

    // Group requests by status for better organization
    const pendingRequests = requests.filter(r => r.status === 'pending');
    const approvedRequests = requests.filter(r => r.status === 'approved');
    const rejectedRequests = requests.filter(r => r.status === 'rejected');

    // Calculate summary
    const hasPending = pendingRequests.length > 0;
    const hasApproved = approvedRequests.length > 0;

    return (
        <div className={cn('border-t pt-4', className)}>
            {/* Section Header */}
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h4 className="font-semibold text-base">Request History</h4>
                    <p className="text-xs text-muted-foreground">
                        {hasPending && `${pendingRequests.length} pending`}
                        {hasPending && hasApproved && ' · '}
                        {hasApproved && `${approvedRequests.length} approved`}
                    </p>
                </div>
            </div>

            {/* Requests List */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
                {/* Show approved first (most actionable for employee) */}
                {approvedRequests.map((req) => (
                    <RequestItem key={req.id} request={req} />
                ))}
                {pendingRequests.map((req) => (
                    <RequestItem key={req.id} request={req} />
                ))}
                {rejectedRequests.map((req) => (
                    <RequestItem key={req.id} request={req} />
                ))}
            </div>

            {/* Approved Parts Guidance */}
            {hasApproved && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-3 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                    ✓ Approved parts are ready for installation. They will be included in the invoice automatically.
                </p>
            )}
        </div>
    );
}

export default SparePartRequestHistory;
