'use client';

/**
 * SparePartApprovalDialog - Admin component for approving/rejecting spare part requests
 * Shows pending requests and allows Admin to assign serial numbers
 * Follows SOLID, KISS, DRY principles
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Check, X, Package } from 'lucide-react';

import { servicesApi } from '@/lib/api';
import { useCompany } from '@/hooks/useCompany';
import { useProductsQuery } from '@/hooks/queries';
import { queryKeys } from '@/lib/query';
import { Service, SparePartRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import SerialManager from '@/components/shared/SerialManager';

// ==================== Types ====================

interface SparePartApprovalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    service: Service | null;
    onSuccess?: () => void;
}

// ==================== Component ====================

export function SparePartApprovalDialog({
    open,
    onOpenChange,
    service,
    onSuccess
}: SparePartApprovalDialogProps) {
    const [loading, setLoading] = useState(false);
    const [serialInputs, setSerialInputs] = useState<Record<string, string[]>>({});
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectingId, setRejectingId] = useState<string | null>(null);

    const queryClient = useQueryClient();
    const { selectedCompany } = useCompany();
    const { data: products = [] } = useProductsQuery(selectedCompany?.id);

    // Serial Manager Modal state
    const [serialModalOpen, setSerialModalOpen] = useState(false);
    const [serialModalRequestId, setSerialModalRequestId] = useState<string | null>(null);

    // Get pending requests
    const pendingRequests = service?.sparePartRequests?.filter(
        (r: SparePartRequest) => r.status === 'pending'
    ) || [];

    // Handle approval
    const handleApprove = async (request: SparePartRequest) => {
        if (!service || !request.id) return;

        const serialNumbers = serialInputs[request.id] || [];

        setLoading(true);
        try {
            await servicesApi.approveSpareRequest(service.id, request.id, {
                action: 'approve',
                serialNumbers: serialNumbers.length > 0 ? serialNumbers : undefined
            });
            toast.success(`Approved request for ${request.productName}`);
            // Invalidate services cache to reflect updated status immediately
            if (service.companyId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.services.byCompany(service.companyId) });
                queryClient.invalidateQueries({ queryKey: ['services', 'my-tasks', service.companyId] });
            }
            onSuccess?.();
            if (pendingRequests.length === 1) {
                onOpenChange(false);
            }
        } catch (error: any) {
            console.error('Error approving request:', error);
            // Extract detailed error message from API response
            const errorMessage = error?.message || error?.detail || 'Failed to approve request';
            toast.error(errorMessage, {
                duration: 5000,
                description: 'Please check stock availability and try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle rejection
    const handleReject = async (requestId: string) => {
        if (!service) return;

        setLoading(true);
        try {
            await servicesApi.approveSpareRequest(service.id, requestId, {
                action: 'reject',
                rejectionReason: rejectionReason || undefined
            });
            toast.success('Request rejected');
            setRejectingId(null);
            setRejectionReason('');
            // Invalidate services cache to reflect updated status immediately
            if (service.companyId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.services.byCompany(service.companyId) });
                queryClient.invalidateQueries({ queryKey: ['services', 'my-tasks', service.companyId] });
            }
            onSuccess?.();
            if (pendingRequests.length === 1) {
                onOpenChange(false);
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            toast.error('Failed to reject request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Spare Part Requests - {service?.serviceNumber}
                        </DialogTitle>
                        <DialogDescription>
                            {pendingRequests.length} pending request(s) for this service
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {pendingRequests.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                                No pending requests
                            </p>
                        ) : (
                            pendingRequests.map((request: SparePartRequest) => (
                                <div
                                    key={request.id}
                                    className="border rounded-lg p-4 space-y-3 bg-muted/20"
                                >
                                    {/* Request Info */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-medium">{request.productName}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                HSN: {request.hsn || 'N/A'} | Qty: {request.quantity}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Requested by: {request.requestedByName}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                                            Pending
                                        </Badge>
                                    </div>

                                    {/* Serial Number Selection (for approval) */}
                                    {/* Serial Number Selection (for approval) */}
                                    {rejectingId !== request.id && (() => {
                                        const product = products.find(p => p.id === request.productId);
                                        const hasSerial = product?.hasSerialNumber === true;

                                        if (!hasSerial) return null;

                                        return (
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs">Serial Numbers:</Label>
                                                <Button
                                                    type="button"
                                                    variant={(serialInputs[request.id!]?.length || 0) < (request.quantity || 0) ? 'outline' : 'secondary'}
                                                    size="sm"
                                                    className={`text-xs ${(serialInputs[request.id!]?.length || 0) < (request.quantity || 0) ? 'border-amber-400 text-amber-600' : 'text-green-600'}`}
                                                    onClick={() => {
                                                        setSerialModalRequestId(request.id!);
                                                        setSerialModalOpen(true);
                                                    }}
                                                >
                                                    {serialInputs[request.id!]?.length || 0}/{request.quantity || 0} Serials
                                                </Button>
                                            </div>
                                        );
                                    })()}

                                    {/* Rejection Reason (when rejecting) */}
                                    {rejectingId === request.id && (
                                        <div>
                                            <Label className="text-xs">Rejection Reason (optional)</Label>
                                            <Textarea
                                                placeholder="Why are you rejecting this request?"
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                className="mt-1"
                                            />
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 justify-end pt-2 border-t">
                                        {rejectingId === request.id ? (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setRejectingId(null)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleReject(request.id!)}
                                                    disabled={loading}
                                                >
                                                    Confirm Reject
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setRejectingId(request.id!)}
                                                    disabled={loading}
                                                >
                                                    <X className="h-4 w-4 mr-1" />
                                                    Reject
                                                </Button>
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => handleApprove(request)}
                                                    disabled={loading}
                                                >
                                                    <Check className="h-4 w-4 mr-1" />
                                                    Approve
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Serial Manager Modal */}
            {
                serialModalRequestId && (() => {
                    const request = pendingRequests.find((r: SparePartRequest) => r.id === serialModalRequestId);
                    return request ? (
                        <SerialManager
                            open={serialModalOpen}
                            onClose={() => {
                                setSerialModalOpen(false);
                                setSerialModalRequestId(null);
                            }}
                            productId={request.productId}
                            initialSelected={serialInputs[request.id!] || []}
                            quantity={request.quantity || 0}
                            fetchFromDb={true}
                            onSave={async (serials) => {
                                setSerialInputs(prev => ({
                                    ...prev,
                                    [request.id!]: serials
                                }));
                                setSerialModalOpen(false);
                                setSerialModalRequestId(null);
                            }}
                        />
                    ) : null;
                })()
            }
        </>
    );
}

export default SparePartApprovalDialog;
