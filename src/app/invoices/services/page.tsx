'use client';

/**
 * Services Page - Admin/Super Admin View
 * Lists all services for the selected company with filtering and actions
 * Follows SOLID, KISS, DRY principles
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Info, Search, Filter, CheckCircle2, Clock, XCircle, FileText, Users } from 'lucide-react';

import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { useServicesQuery } from '@/hooks/queries';
import { Service, ServiceStatusType, ServiceType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { TableSkeleton } from '@/components/shared/Skeletons';
import { ServiceAttendDialog } from '@/components/services';
import { Wrench } from 'lucide-react';

// ==================== Helper Functions ====================

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

const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

// ==================== Main Content Component ====================

function ServicesContent() {
    const router = useRouter();
    const { selectedCompany } = useCompany();
    const { user } = useAuth();

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [attendOpen, setAttendOpen] = useState(false);

    // React Query - replaces manual useState/useEffect fetching
    const { data: services = [], isLoading: loading, error } = useServicesQuery(
        selectedCompany?.id,
        statusFilter !== 'all' ? statusFilter : undefined
    );

    // RBAC: Redirect employees
    useEffect(() => {
        if (user?.role === 'employee') {
            router.push('/invoices/my-tasks');
        }
    }, [user, router]);

    // Filtered services
    const filteredServices = services.filter((service) => {
        const matchesSearch =
            service.serviceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.problemDescription.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const handleViewDetails = (service: Service) => {
        setSelectedService(service);
        setDetailsOpen(true);
    };

    // Open attend dialog
    const handleAttend = (service: Service) => {
        setSelectedService(service);
        setAttendOpen(true);
    };

    // No company selected state
    if (!selectedCompany) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Services</h1>
                </div>
                <div className="rounded-lg border border-dashed p-12 text-center">
                    <p className="text-muted-foreground">Please select a company to manage services</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Service Management</h1>
                    <p className="text-sm text-muted-foreground">Manage service calls and assignments</p>
                </div>
                <Button onClick={() => router.push('/invoices/services/create')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Service
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search services..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <TableSkeleton />
            ) : filteredServices.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center">
                    <p className="text-muted-foreground">
                        {searchQuery || statusFilter !== 'all'
                            ? 'No services match your filters'
                            : 'No services yet. Create your first service!'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredServices.map((service) => (
                        <div
                            key={service.id}
                            className={`rounded-xl border-2 p-4 bg-card shadow-sm hover:shadow-md transition-all cursor-pointer ${service.status === 'open' ? 'border-l-blue-500' :
                                service.status === 'pending' ? 'border-l-yellow-500' :
                                    'border-l-green-500'
                                } border-l-4`}
                            onClick={() => handleViewDetails(service)}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-lg">{service.serviceNumber}</span>
                                {getStatusBadge(service.status)}
                            </div>

                            {/* Client */}
                            <p className="font-medium truncate mb-1">{service.clientName || 'Unknown Client'}</p>

                            {/* Type & Date */}
                            <div className="flex items-center gap-2 mb-2 flex-wrap text-xs">
                                {getServiceTypeBadge(service.serviceType)}
                                <span className="text-muted-foreground">
                                    {formatDate(service.createdAt)}
                                </span>
                            </div>

                            {/* Assigned To */}
                            <div className="flex flex-wrap gap-1 mb-3">
                                {service.assignedToNames?.slice(0, 2).map((name, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950">
                                        <Users className="h-3 w-3 mr-1" />
                                        {name}
                                    </Badge>
                                ))}
                                {(service.assignedToNames?.length || 0) > 2 && (
                                    <Badge variant="secondary" className="text-xs">
                                        +{service.assignedToNames!.length - 2}
                                    </Badge>
                                )}
                            </div>

                            {/* Problem Preview */}
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {service.problemDescription || 'No description'}
                            </p>

                            {/* Action Buttons - Touch Friendly */}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 h-10"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewDetails(service);
                                    }}
                                >
                                    <Info className="h-4 w-4 mr-2" />
                                    Details
                                </Button>
                                {service.status !== 'closed' && (
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="flex-1 h-10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAttend(service);
                                        }}
                                    >
                                        <Wrench className="h-4 w-4 mr-2" />
                                        Attend
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Service Attend Dialog */}
            <ServiceAttendDialog
                open={attendOpen}
                onOpenChange={setAttendOpen}
                service={selectedService}
                onSuccess={() => {
                    // Refetch is handled by React Query invalidation
                }}
            />

            {/* Service Details Dialog - Mobile Optimized */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="w-full max-w-2xl max-h-[95vh] overflow-y-auto sm:rounded-xl rounded-t-xl sm:m-4 m-0 fixed bottom-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2">
                    <DialogHeader>
                        <DialogTitle>Service Details - {selectedService?.serviceNumber}</DialogTitle>
                        <DialogDescription>
                            Full information about this service call
                        </DialogDescription>
                    </DialogHeader>

                    {selectedService && (
                        <div className="space-y-4">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Client</p>
                                    <p className="font-medium">{selectedService.clientName}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                                    {getStatusBadge(selectedService.status)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Service Type</p>
                                    {getServiceTypeBadge(selectedService.serviceType)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Call Date</p>
                                    <p>{formatDate(selectedService.callDate)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                                    <p>{formatDate(selectedService.assignedDate)} at {selectedService.assignedTime}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Created By</p>
                                    <p>{selectedService.createdByName || 'Unknown'}</p>
                                </div>
                            </div>

                            {/* Service Address */}
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Service Address</p>
                                <p className="mt-1 text-sm bg-muted p-2 rounded">
                                    {selectedService.serviceAddress?.street || 'N/A'}, {selectedService.serviceAddress?.city || ''}, {selectedService.serviceAddress?.state || ''} - {selectedService.serviceAddress?.pincode || ''}
                                </p>
                            </div>

                            {/* Problem Description */}
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Problem Description</p>
                                <p className="mt-1 text-sm bg-muted p-2 rounded">{selectedService.problemDescription}</p>
                            </div>

                            {/* Initial Solution */}
                            {selectedService.initialSolution && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Initial Solution</p>
                                    <p className="mt-1 text-sm bg-muted p-2 rounded">{selectedService.initialSolution}</p>
                                </div>
                            )}

                            {/* Assigned Employees */}
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Assigned To</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedService.assignedToNames?.map((name, idx) => (
                                        <Badge key={idx} variant="outline">{name}</Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Resolution Details - Visible to Admin */}
                            {selectedService.resolution && (
                                <div className="border-t pt-4">
                                    <h4 className="font-medium mb-2 text-green-600">Employee Resolution Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Attended By</p>
                                            <p className="font-medium">{selectedService.resolution.attendedByName}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Attended At</p>
                                            <p>{selectedService.resolution.attendedAt
                                                ? formatDate(selectedService.resolution.attendedAt)
                                                : 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Status</p>
                                            <Badge variant={selectedService.resolution.isSolved ? "default" : "secondary"} className={selectedService.resolution.isSolved ? "bg-green-600" : ""}>
                                                {selectedService.resolution.isSolved ? 'Solved' : 'Pending'}
                                            </Badge>
                                        </div>
                                    </div>

                                    {selectedService.resolution.observation && (
                                        <div className="mt-3">
                                            <p className="text-sm font-medium text-muted-foreground">Observation</p>
                                            <p className="text-sm bg-muted p-2 rounded mt-1">{selectedService.resolution.observation}</p>
                                        </div>
                                    )}

                                    {selectedService.resolution.actionTaken && (
                                        <div className="mt-3">
                                            <p className="text-sm font-medium text-muted-foreground">Action Taken / Solution</p>
                                            <p className="text-sm bg-green-50 dark:bg-green-950 p-2 rounded mt-1 border border-green-200 dark:border-green-800">{selectedService.resolution.actionTaken}</p>
                                        </div>
                                    )}

                                    {selectedService.resolution.proofDocumentUrl && (
                                        <div className="mt-3">
                                            <p className="text-sm font-medium text-muted-foreground">Proof Document</p>
                                            <a
                                                href={selectedService.resolution.proofDocumentUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 underline text-sm inline-flex items-center gap-1 mt-1"
                                            >
                                                <FileText className="h-3 w-3" />
                                                View Proof Document
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Service History Timeline */}
                            {selectedService.serviceHistory && selectedService.serviceHistory.length > 0 && (
                                <div className="border-t pt-4">
                                    <h4 className="font-medium mb-3 text-blue-600 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Attendance History ({selectedService.serviceHistory.length} visit{selectedService.serviceHistory.length > 1 ? 's' : ''})
                                    </h4>
                                    <div className="space-y-3 max-h-64 overflow-y-auto">
                                        {selectedService.serviceHistory
                                            .slice()
                                            .sort((a, b) => new Date(b.attendedAt || 0).getTime() - new Date(a.attendedAt || 0).getTime())
                                            .map((record, idx) => (
                                                <div key={idx} className="bg-muted/50 p-3 rounded-lg border-l-4 border-l-blue-400">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-sm">{record.attendedByName || 'Unknown'}</span>
                                                            <Badge variant={record.isSolved ? "default" : "secondary"} className={record.isSolved ? "bg-green-600 text-xs" : "text-xs"}>
                                                                {record.isSolved ? 'Solved' : 'Pending'}
                                                            </Badge>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">
                                                            {record.attendedAt ? formatDate(record.attendedAt) : 'N/A'}
                                                        </span>
                                                    </div>
                                                    {record.observation && (
                                                        <p className="text-xs text-muted-foreground mb-1">
                                                            <strong>Observation:</strong> {record.observation}
                                                        </p>
                                                    )}
                                                    {record.actionTaken && (
                                                        <p className="text-xs mb-1">
                                                            <strong>Action:</strong> {record.actionTaken}
                                                        </p>
                                                    )}
                                                    {record.proofDocumentUrl && (
                                                        <a
                                                            href={record.proofDocumentUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-blue-600 underline inline-flex items-center gap-1"
                                                        >
                                                            <FileText className="h-3 w-3" /> View Proof
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* Invoice Info / Create Invoice */}
                            {selectedService.invoiceId ? (
                                <div className="border-t pt-4">
                                    <Badge variant="outline" className="border-green-500 text-green-500">
                                        <FileText className="h-3 w-3 mr-1" />
                                        Invoice Created
                                    </Badge>
                                </div>
                            ) : selectedService.status === 'closed' && selectedService.resolution?.isSolved ? (
                                <div className="border-t pt-4">
                                    <Button
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => {
                                            router.push(`/invoices/invoices?createFor=${selectedService.id}`);
                                            setDetailsOpen(false);
                                        }}
                                    >
                                        <FileText className="h-4 w-4 mr-2" />
                                        Create Invoice
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ==================== Export with DashboardLayout ====================

export default function ServicesPage() {
    return (
        <DashboardLayout>
            <ServicesContent />
        </DashboardLayout>
    );
}
