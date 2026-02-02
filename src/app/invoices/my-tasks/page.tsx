'use client';

/**
 * My Tasks Page - Employee View
 * Shows services assigned to the current employee with table/card responsive layout
 * Refactored to use ServiceList component for UI consistency
 */

import React, { useState } from 'react';
import { Info, Users, Clock, CheckCircle2, XCircle, PlayCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { useMyTasksQuery } from '@/hooks/queries';
import { servicesApi } from '@/lib/api';
import { Service, ServiceStatusType, ServiceType, ServiceResolution } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { TableSkeleton } from '@/components/shared/Skeletons';
import { ServiceList, ServiceAttendDialog } from '@/components/services';

// ==================== Helper Functions ====================

const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const getStatusBadge = (status: ServiceStatusType) => {
    switch (status) {
        case 'open':
            return <Badge variant="outline" className="border-blue-500 text-blue-500"><Clock className="w-3 h-3 mr-1" />Open</Badge>;
        case 'pending':
            return <Badge variant="outline" className="border-yellow-500 text-yellow-500"><XCircle className="w-3 h-3 mr-1" />Pending</Badge>;
        case 'closed':
            return <Badge variant="outline" className="border-green-500 text-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Closed</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};

const getServiceTypeBadge = (type: ServiceType) => {
    const typeLabels: Record<ServiceType, string> = {
        warranty: 'Warranty',
        per_call: 'Per Call',
        amc: 'AMC',
        new_installation: 'New Installation',
    };
    return <Badge variant="secondary">{typeLabels[type] || type}</Badge>;
};

// ==================== Main Content Component ====================

function MyTasksContent() {
    const { selectedCompany } = useCompany();
    const { user } = useAuth();

    // State  
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [attendOpen, setAttendOpen] = useState(false);

    // React Query
    const { data: services = [], isLoading: loading, refetch } = useMyTasksQuery(
        selectedCompany?.id,
        user?.id
    );

    // Handlers
    const handleViewDetails = (service: Service) => {
        setSelectedService(service);
        setDetailsOpen(true);
    };

    const handleAttend = (service: Service) => {
        setSelectedService(service);
        setAttendOpen(true);
    };

    // Create invoice from resolved service
    const handleCreateInvoice = async (service: Service) => {
        if (!service.resolution?.isSolved) {
            toast.error('Can only create invoice for solved services');
            return;
        }
        if (service.invoiceId) {
            toast.error('Invoice already created for this service');
            return;
        }
        if (!service.resolution.proofDocumentUrl) {
            toast.error('Proof document is required before creating invoice');
            return;
        }

        try {
            const result = await servicesApi.createInvoice(service.id);
            toast.success(`Invoice ${result.invoiceNumber} created successfully!`);
            refetch();
        } catch (error: any) {
            console.error('Error creating invoice:', error);
            toast.error(error.message || 'Failed to create invoice');
        }
    };

    // No company selected state
    if (!selectedCompany) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="My Assigned Tasks"
                    description="View and update your service assignments"
                />
                <div className="rounded-lg border border-dashed p-12 text-center">
                    <p className="text-muted-foreground">Please select a company to view your tasks</p>
                </div>
            </div>
        );
    }

    // Loading state
    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="My Assigned Tasks"
                    description="View and update your service assignments"
                />
                <TableSkeleton />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                title="My Assigned Tasks"
                description="View and update your service assignments"
            />

            {/* Service List (Table/Cards) - Employee view (no request review) */}
            <ServiceList
                services={services}
                onView={handleViewDetails}
                onAttend={handleAttend}
                showAttendActions={true}
                showRequestReview={false}
            />

            {/* Attend Dialog */}
            <ServiceAttendDialog
                open={attendOpen}
                onOpenChange={setAttendOpen}
                service={selectedService}
                onSuccess={() => refetch()}
            />

            {/* Service Details Dialog */}
            <TaskDetailsDialog
                service={selectedService}
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                onCreateInvoice={handleCreateInvoice}
            />
        </div>
    );
}

// ==================== Task Details Dialog ====================

interface TaskDetailsDialogProps {
    service: Service | null;
    open: boolean;
    onClose: () => void;
    onCreateInvoice: (service: Service) => void;
}

function TaskDetailsDialog({ service, open, onClose, onCreateInvoice }: TaskDetailsDialogProps) {
    if (!service) return null;

    const canCreateInvoice = service.resolution?.isSolved &&
        !service.invoiceId &&
        service.resolution.proofDocumentUrl;

    return (
        <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-full max-w-2xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Task Details - {service.serviceNumber}</DialogTitle>
                    <DialogDescription>
                        Full information about this service call
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Client</p>
                            <p className="font-medium">{service.clientName}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Status</p>
                            {getStatusBadge(service.status)}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Service Type</p>
                            {getServiceTypeBadge(service.serviceType)}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                            <p>{formatDate(service.assignedDate || service.createdAt)} at {service.assignedTime || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Created</p>
                            <p>{formatDate(service.createdAt)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Invoice Status</p>
                            {service.invoiceId ? (
                                <Badge variant="outline" className="border-green-500 text-green-500">
                                    ✓ Invoiced
                                </Badge>
                            ) : (
                                <Badge variant="secondary">Not Invoiced</Badge>
                            )}
                        </div>
                    </div>

                    {/* Address */}
                    {service.serviceAddress && (
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Service Address</p>
                            <p className="text-sm p-3 bg-muted/20 rounded">
                                {service.serviceAddress.street}, {service.serviceAddress.city}, {service.serviceAddress.state} - {service.serviceAddress.pincode}
                            </p>
                        </div>
                    )}

                    {/* Problem Description */}
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Problem Description</p>
                        <p className="text-sm p-3 bg-muted/20 rounded">
                            {service.problemDescription || 'No description provided'}
                        </p>
                    </div>

                    {/* Resolution (if closed) */}
                    {service.resolution && (
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Resolution</p>
                            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                                <p className="text-sm">{service.resolution.actionTaken || service.resolution.observation || 'Resolved'}</p>
                                {service.resolution.attendedAt && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Resolved on {formatDate(service.resolution.attendedAt)}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Create Invoice Action */}
                    {canCreateInvoice && (
                        <div className="border-t pt-4">
                            <Button onClick={() => onCreateInvoice(service)} className="w-full">
                                <FileText className="h-4 w-4 mr-2" />
                                Create Invoice
                            </Button>
                        </div>
                    )}

                    {/* Service History */}
                    {service.serviceHistory && service.serviceHistory.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Service History ({service.serviceHistory.length})</p>
                            <div className="space-y-2">
                                {service.serviceHistory.map((visit: ServiceResolution, idx: number) => (
                                    <div key={idx} className="p-3 border rounded bg-muted/10">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-medium">{visit.attendedByName || 'Technician'}</p>
                                                <p className="text-xs text-muted-foreground">{formatDate(visit.attendedAt || new Date())}</p>
                                            </div>
                                            <Badge variant={visit.isSolved ? 'default' : 'secondary'}>
                                                {visit.isSolved ? 'Resolved' : 'Pending'}
                                            </Badge>
                                        </div>
                                        {visit.actionTaken && <p className="text-sm mt-2">{visit.actionTaken}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ==================== Page Export ====================

export default function MyTasksPage() {
    return (
        <DashboardLayout>
            <MyTasksContent />
        </DashboardLayout>
    );
}
