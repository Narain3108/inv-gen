'use client';

/**
 * My Tasks Page - Employee View
 * Shows services assigned to the current employee
 * Follows SOLID, KISS, DRY principles
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Info, Search, Filter, CheckCircle2, Clock, XCircle, PlayCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { servicesApi } from '@/lib/api';
import { Service, ServiceStatusType, ServiceType, ServiceAttendData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
    DialogFooter,
} from '@/components/ui/dialog';
import { TableSkeleton } from '@/components/shared/Skeletons';
import { DocumentUpload } from '@/components/shared/DocumentUpload';

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

function MyTasksContent() {
    const router = useRouter();
    const { selectedCompany } = useCompany();
    const { user } = useAuth();

    // State
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [attendOpen, setAttendOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Attend form state
    const [attendForm, setAttendForm] = useState<ServiceAttendData>({
        observation: '',
        actionTaken: '',
        isSolved: false,
    });
    const [proofDocumentUrl, setProofDocumentUrl] = useState('');
    const [createInvoiceAfterSolved, setCreateInvoiceAfterSolved] = useState(false);

    // Load services assigned to current user
    const loadServices = useCallback(async () => {
        if (!selectedCompany?.id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const data = await servicesApi.getAll(selectedCompany.id, {
                assignedToMe: true,
                status: statusFilter !== 'all' ? statusFilter : undefined,
            });
            setServices(data);
        } catch (error) {
            console.error('Error loading services:', error);
            toast.error('Failed to load your tasks');
        } finally {
            setLoading(false);
        }
    }, [selectedCompany?.id, statusFilter]);

    useEffect(() => {
        loadServices();
    }, [loadServices]);

    // Filtered services
    const filteredServices = services.filter((service) => {
        const matchesSearch =
            service.serviceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.problemDescription.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    // View service details
    const handleViewDetails = (service: Service) => {
        setSelectedService(service);
        setDetailsOpen(true);
    };

    // Open attend form
    const handleAttend = (service: Service) => {
        setSelectedService(service);
        setAttendForm({
            observation: '',
            actionTaken: '',
            isSolved: false,
        });
        setProofDocumentUrl('');
        setCreateInvoiceAfterSolved(false);
        setAttendOpen(true);
    };

    // Submit attend form
    const handleSubmitAttend = async () => {
        if (!selectedService) return;

        // Validate proof document for solved status
        if (attendForm.isSolved && !proofDocumentUrl) {
            toast.error('Please upload proof document before marking as solved');
            return;
        }

        setSubmitting(true);
        try {
            const attendData: ServiceAttendData = {
                ...attendForm,
                proofDocumentUrl: proofDocumentUrl || undefined,
            };

            await servicesApi.attend(selectedService.id, attendData);
            toast.success(attendForm.isSolved ? 'Service marked as solved!' : 'Service status updated');

            setAttendOpen(false);
            loadServices();

            // Redirect to invoice creation if selected
            if (attendForm.isSolved && createInvoiceAfterSolved) {
                router.push(`/invoices/invoices?createFor=${selectedService.id}`);
            }
        } catch (error) {
            console.error('Error attending service:', error);
            toast.error('Failed to update service');
        } finally {
            setSubmitting(false);
        }
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

        setSubmitting(true);
        try {
            const result = await servicesApi.createInvoice(service.id);
            toast.success(`Invoice ${result.invoiceNumber} created successfully!`);
            loadServices(); // Refresh to show updated status
        } catch (error: any) {
            console.error('Error creating invoice:', error);
            toast.error(error.message || 'Failed to create invoice');
        } finally {
            setSubmitting(false);
        }
    };

    // No company selected state
    if (!selectedCompany) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">My Assigned Tasks</h1>
                </div>
                <div className="rounded-lg border border-dashed p-12 text-center">
                    <p className="text-muted-foreground">Please select a company to view your tasks</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">My Assigned Tasks</h1>
                    <p className="text-sm text-muted-foreground">View and update your service assignments</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tasks..."
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

            {/* Tasks - Mobile-First Card Layout */}
            {loading ? (
                <TableSkeleton />
            ) : filteredServices.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center">
                    <p className="text-muted-foreground">
                        {searchQuery || statusFilter !== 'all'
                            ? 'No tasks match your filters'
                            : 'No tasks assigned to you yet'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredServices.map((service) => (
                        <div
                            key={service.id}
                            className={`rounded-xl border-2 p-4 bg-card shadow-sm hover:shadow-md transition-all ${service.status === 'open' ? 'border-l-blue-500' :
                                service.status === 'pending' ? 'border-l-yellow-500' :
                                    'border-l-green-500'
                                } border-l-4`}
                        >
                            {/* Header with Service Number & Status */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-bold text-lg">{service.serviceNumber}</span>
                                {getStatusBadge(service.status)}
                            </div>

                            {/* Client Name */}
                            <div className="mb-2">
                                <p className="font-medium text-base truncate">{service.clientName || 'Unknown Client'}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {service.serviceAddress?.city || 'No address'}
                                </p>
                            </div>

                            {/* Service Type & Schedule */}
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                                {getServiceTypeBadge(service.serviceType)}
                                <Badge variant="outline" className="text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatDate(service.assignedDate)} · {service.assignedTime}
                                </Badge>
                            </div>

                            {/* Problem Preview */}
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                {service.problemDescription || 'No description provided'}
                            </p>

                            {/* Action Buttons - Touch Friendly */}
                            <div className="flex gap-2 pt-3 border-t">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 h-10"
                                    onClick={() => handleViewDetails(service)}
                                >
                                    <Info className="h-4 w-4 mr-1" />
                                    Details
                                </Button>
                                {service.status !== 'closed' && (
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="flex-1 h-10 bg-blue-600 hover:bg-blue-700"
                                        onClick={() => handleAttend(service)}
                                    >
                                        <PlayCircle className="h-4 w-4 mr-1" />
                                        Attend
                                    </Button>
                                )}
                                {service.invoiceId && (
                                    <Badge variant="outline" className="border-green-500 text-green-500 self-center">
                                        ✓ Invoiced
                                    </Badge>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}


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
                                    <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                                    <p>{formatDate(selectedService.assignedDate)} at {selectedService.assignedTime}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Call Date</p>
                                    <p>{formatDate(selectedService.callDate)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Created By</p>
                                    <p>{selectedService.createdByName || 'Unknown'}</p>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Contact & Address</p>
                                <div className="bg-muted p-3 rounded-md text-sm">
                                    <p>{selectedService.serviceAddress?.street}</p>
                                    <p>{selectedService.serviceAddress?.city}, {selectedService.serviceAddress?.state} - {selectedService.serviceAddress?.pincode}</p>
                                </div>
                            </div>

                            {/* Problem */}
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Problem Description</p>
                                <p className="text-sm bg-muted p-3 rounded-md">{selectedService.problemDescription}</p>
                            </div>

                            {/* Initial Solution (from Admin) */}
                            {selectedService.initialSolution && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Initial Solution (Admin Notes)</p>
                                    <p className="mt-1 text-sm bg-blue-50 dark:bg-blue-950 p-2 rounded border border-blue-200 dark:border-blue-800">{selectedService.initialSolution}</p>
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

                            {/* Resolution Details (if attended) */}
                            {selectedService.status === 'closed' && selectedService.resolution && (
                                <div className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10 p-4 rounded-md">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold text-green-700 dark:text-green-400">Resolution Details</h4>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-muted-foreground">Solved</p>
                                            <Badge variant={selectedService.resolution.isSolved ? "default" : "secondary"}>
                                                {selectedService.resolution.isSolved ? 'Yes' : 'No'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Attended By</p>
                                            <p>{selectedService.resolution.attendedByName}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Attended At</p>
                                            <p>{selectedService.resolution.attendedAt
                                                ? formatDate(selectedService.resolution.attendedAt)
                                                : 'N/A'}</p>
                                        </div>
                                    </div>
                                    {selectedService.resolution.observation && (
                                        <div className="mt-2">
                                            <p className="text-sm font-medium text-muted-foreground">Observation</p>
                                            <p className="text-sm bg-muted p-2 rounded">{selectedService.resolution.observation}</p>
                                        </div>
                                    )}
                                    {selectedService.resolution.actionTaken && (
                                        <div className="mt-2">
                                            <p className="text-sm font-medium text-muted-foreground">Action Taken</p>
                                            <p className="text-sm bg-green-50 dark:bg-green-950 p-2 rounded border border-green-200 dark:border-green-800">{selectedService.resolution.actionTaken}</p>
                                        </div>
                                    )}
                                    {selectedService.resolution.proofDocumentUrl && (
                                        <div className="mt-2">
                                            <p className="text-sm font-medium text-muted-foreground">Proof Document</p>
                                            <a href={selectedService.resolution.proofDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
                                                View Proof Document
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Attend Service Dialog - Enhanced with Proof Upload */}
            <Dialog open={attendOpen} onOpenChange={setAttendOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Attend Service - {selectedService?.serviceNumber}</DialogTitle>
                        <DialogDescription>
                            Record your observation and solution
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="observation">Observation</Label>
                            <Textarea
                                id="observation"
                                placeholder="What did you observe on site?"
                                value={attendForm.observation}
                                onChange={(e) => setAttendForm({ ...attendForm, observation: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label htmlFor="actionTaken">Action Taken / Solution</Label>
                            <Textarea
                                id="actionTaken"
                                placeholder="What action did you take to resolve the issue?"
                                value={attendForm.actionTaken}
                                onChange={(e) => setAttendForm({ ...attendForm, actionTaken: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label>Was the issue resolved?</Label>
                            <div className="flex gap-4 mt-2">
                                <Button
                                    type="button"
                                    variant={attendForm.isSolved ? "default" : "outline"}
                                    className={attendForm.isSolved ? "bg-green-600 hover:bg-green-700" : ""}
                                    onClick={() => setAttendForm({ ...attendForm, isSolved: true })}
                                >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Solved
                                </Button>
                                <Button
                                    type="button"
                                    variant={!attendForm.isSolved ? "default" : "outline"}
                                    className={!attendForm.isSolved ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                                    onClick={() => setAttendForm({ ...attendForm, isSolved: false })}
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Not Solved
                                </Button>
                            </div>
                        </div>

                        {/* Proof Document Upload - Required for Solved */}
                        {attendForm.isSolved && (
                            <div className="border-t pt-4 space-y-4">
                                <DocumentUpload
                                    label="Proof Document (Required)"
                                    currentDocumentUrl={proofDocumentUrl}
                                    onDocumentUploaded={(url) => setProofDocumentUrl(url)}
                                    onDocumentRemoved={() => setProofDocumentUrl('')}
                                    folder="service-proofs"
                                    accept="image/png,image/jpeg,image/jpg,application/pdf"
                                    maxSize={5}
                                />
                                {!proofDocumentUrl && (
                                    <p className="text-xs text-red-500 mt-1">
                                        Proof document is mandatory to mark as solved
                                    </p>
                                )}

                                {/* Create Invoice Switch */}
                                <div className="flex items-center space-x-2 bg-muted/30 p-3 rounded-md border border-dashed border-primary/20">
                                    <Switch
                                        id="createInvoice"
                                        checked={createInvoiceAfterSolved}
                                        onCheckedChange={setCreateInvoiceAfterSolved}
                                    />
                                    <Label htmlFor="createInvoice" className="cursor-pointer font-medium">
                                        Create Invoice now related to this service
                                    </Label>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAttendOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitAttend}
                            disabled={submitting || (attendForm.isSolved && !proofDocumentUrl)}
                        >
                            {submitting ? 'Submitting...' : 'Submit'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ==================== Export with DashboardLayout ====================

export default function MyTasksPage() {
    return (
        <DashboardLayout>
            <MyTasksContent />
        </DashboardLayout>
    );
}
