'use client';

/**
 * Services Page - Admin/Super Admin View
 * Lists all services with table/card layout for consistency with Invoice/Purchase pages
 * Refactored to use ServiceList component for UI consistency
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users, Clock, CheckCircle2, XCircle, FileText, Loader2 } from 'lucide-react';

import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { useServicesQuery } from '@/hooks/queries';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { servicesApi } from '@/lib/api/services.api';
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
import { ServiceList, ServiceAttendDialog, SparePartApprovalDialog } from '@/components/services';

// ==================== Helper Functions ====================

const formatDate = (date: string | Date) => {
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

function ServicesContent() {
    const router = useRouter();
    const { selectedCompany } = useCompany();
    const { user } = useAuth();

    // State
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [attendOpen, setAttendOpen] = useState(false);
    const [approvalOpen, setApprovalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteConfirmIds, setDeleteConfirmIds] = useState<string[] | null>(null);

    // React Query
    const queryClient = useQueryClient();
    const { data: services = [], isLoading: loading } = useServicesQuery(selectedCompany?.id);

    // RBAC
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

    // RBAC: Redirect employees
    useEffect(() => {
        if (user?.role === 'employee') {
            router.push('/invoices/my-tasks');
        }
    }, [user, router]);

    // Handlers
    const handleViewDetails = (service: Service) => {
        setSelectedService(service);
        setDetailsOpen(true);
    };

    const handleAttend = (service: Service) => {
        setSelectedService(service);
        setAttendOpen(true);
    };

    const handleReviewRequests = (service: Service) => {
        setSelectedService(service);
        setApprovalOpen(true);
    };

    const handleDeleteServices = (serviceIds: string[]) => {
        setDeleteConfirmIds(serviceIds);
    };

    const confirmDeleteServices = async () => {
        if (!deleteConfirmIds) return;
        
        setIsDeleting(true);
        try {
            await servicesApi.batchDelete(deleteConfirmIds);
            toast.success(`Successfully deleted ${deleteConfirmIds.length} service(s)`);
            queryClient.invalidateQueries({ queryKey: ['services', selectedCompany?.id] });
            setDeleteConfirmIds(null);
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete services');
        } finally {
            setIsDeleting(false);
        }
    };

    // No company selected state
    if (!selectedCompany) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Service Management"
                    description="Manage service calls and assignments"
                >
                    <Button disabled>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Service
                    </Button>
                </PageHeader>
                <div className="rounded-lg border border-dashed p-12 text-center">
                    <p className="text-muted-foreground">Please select a company to manage services</p>
                </div>
            </div>
        );
    }

    // Loading state
    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Service Management"
                    description="Manage service calls and assignments"
                />
                <TableSkeleton />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                title="Service Management"
                description="Manage service calls and assignments"
            >
                <Button onClick={() => router.push('/invoices/services/create')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Service
                </Button>
            </PageHeader>

            {/* Service List (Table/Cards) */}
            <ServiceList
                services={services}
                onView={handleViewDetails}
                onAttend={handleAttend}
                onReviewRequests={handleReviewRequests}
                onDelete={isAdmin ? handleDeleteServices : undefined}
                isDeleting={isDeleting}
                showAttendActions={true}
                showRequestReview={true}
            />

            {/* Service Attend Dialog */}
            <ServiceAttendDialog
                open={attendOpen}
                onOpenChange={setAttendOpen}
                service={selectedService}
                onSuccess={() => {
                    // Refetch handled by React Query invalidation
                }}
            />

            {/* Spare Part Approval Dialog */}
            <SparePartApprovalDialog
                open={approvalOpen}
                onOpenChange={setApprovalOpen}
                service={selectedService}
                onSuccess={() => {
                    // Refetch handled by React Query invalidation
                }}
            />

            {/* Service Details Dialog */}
            <ServiceDetailsDialog
                service={selectedService}
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteConfirmIds} onOpenChange={(open) => !open && setDeleteConfirmIds(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {deleteConfirmIds?.length} service(s)? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setDeleteConfirmIds(null)} disabled={isDeleting}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDeleteServices} disabled={isDeleting}>
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ==================== Service Details Dialog ====================

interface ServiceDetailsDialogProps {
    service: Service | null;
    open: boolean;
    onClose: () => void;
}

function ServiceDetailsDialog({ service, open, onClose }: ServiceDetailsDialogProps) {
    if (!service) return null;

    return (
        <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-full max-w-2xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Service Details - {service.serviceNumber}</DialogTitle>
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
                    </div>

                    {/* Address */}
                    {service.serviceAddress && (
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Service Address</p>
                            <p className="text-sm">
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

                    {/* Assigned Team */}
                    {service.assignedToNames && service.assignedToNames.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Assigned Team</p>
                            <div className="flex flex-wrap gap-2">
                                {service.assignedToNames.map((name, idx) => (
                                    <Badge key={idx} variant="outline" className="bg-blue-50 dark:bg-blue-950">
                                        <Users className="h-3 w-3 mr-1" />
                                        {name}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

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

export default function ServicesPage() {
    return (
        <DashboardLayout>
            <ServicesContent />
        </DashboardLayout>
    );
}
