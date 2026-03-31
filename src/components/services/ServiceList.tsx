/**
 * Service List Component
 * Displays services in a responsive table (desktop) and cards (mobile)
 * Follows InvoiceList.tsx and PurchaseList.tsx pattern for UI consistency
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Service, ServiceStatusType, ServiceType } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Search,
    Filter,
    MoreVertical,
    Info,
    Wrench,
    Package,
    Users,
    Clock,
    CheckCircle2,
    XCircle,
    FileText,
    Receipt,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

// ==================== Types ====================

interface ServiceListProps {
    services: Service[];
    onView: (service: Service) => void;
    onAttend?: (service: Service) => void;
    onReviewRequests?: (service: Service) => void;
    showAttendActions?: boolean;
    showRequestReview?: boolean;
}

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

const getPendingRequestCount = (service: Service): number => {
    return service.sparePartRequests?.filter(r => r.status === 'pending').length || 0;
};

// ==================== Component ====================

export function ServiceList({
    services,
    onView,
    onAttend,
    onReviewRequests,
    showAttendActions = true,
    showRequestReview = true,
}: ServiceListProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Filter services
    const filteredServices = services.filter((service) => {
        const matchesSearch =
            service.serviceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.problemDescription.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Empty state
    if (services.length === 0) {
        return (
            <EmptyState
                title="No Services Yet"
                description="Create your first service to start managing service calls."
                icon={FileText}
            />
        );
    }

    return (
        <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search services..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-card"
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

            {/* Desktop Table */}
            <Card className="overflow-hidden hidden md:block">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="p-3 text-left text-sm font-medium">Service #</th>
                                <th className="p-3 text-left text-sm font-medium">Client</th>
                                <th className="p-3 text-left text-sm font-medium">Type</th>
                                <th className="p-3 text-left text-sm font-medium">Scheduled</th>
                                <th className="p-3 text-left text-sm font-medium">Assigned To</th>
                                <th className="p-3 text-center text-sm font-medium">Status</th>
                                <th className="p-3 text-center text-sm font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredServices.map((service) => {
                                const pendingCount = getPendingRequestCount(service);

                                return (
                                    <tr
                                        key={service.id}
                                        className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                                        onClick={() => onView(service)}
                                    >
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-medium">{service.serviceNumber}</span>
                                                {pendingCount > 0 && (
                                                    <Badge variant="destructive" className="text-xs animate-pulse">
                                                        <Package className="h-3 w-3 mr-1" />
                                                        {pendingCount}
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div>
                                                <span className="text-sm font-medium">{service.clientName || 'Unknown'}</span>
                                                {service.serviceAddress?.city && (
                                                    <p className="text-xs text-muted-foreground">{service.serviceAddress.city}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            {getServiceTypeBadge(service.serviceType)}
                                        </td>
                                        <td className="p-3">
                                            <span className="text-sm">{formatDate(service.assignedDate || service.createdAt)}</span>
                                            {service.assignedTime && (
                                                <span className="text-xs text-muted-foreground ml-1">· {service.assignedTime}</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
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
                                        </td>
                                        <td className="p-3 text-center">
                                            {getStatusBadge(service.status)}
                                        </td>
                                        <td className="p-3 text-center">
                                            <div
                                                className="flex items-center justify-center gap-1"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Button variant="ghost" size="sm" onClick={() => onView(service)}>
                                                    <Info className="h-4 w-4" />
                                                </Button>
                                                {showAttendActions && service.status !== 'closed' && onAttend && (
                                                    <Button variant="outline" size="sm" onClick={() => onAttend(service)}>
                                                        <Wrench className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {showRequestReview && pendingCount > 0 && onReviewRequests && (
                                                    <Button variant="destructive" size="sm" onClick={() => onReviewRequests(service)}>
                                                        <Package className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {service.status === 'closed' && !service.invoiceId && (
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        className="bg-emerald-600 hover:bg-emerald-700"
                                                        onClick={() => router.push(`/invoices/invoices?serviceId=${service.id}`)}
                                                    >
                                                        <Receipt className="h-4 w-4 mr-1" />
                                                        Bill
                                                    </Button>
                                                )}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => onView(service)}>
                                                            <Info className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        {showAttendActions && service.status !== 'closed' && onAttend && (
                                                            <DropdownMenuItem onClick={() => onAttend(service)}>
                                                                <Wrench className="mr-2 h-4 w-4" />
                                                                Attend Service
                                                            </DropdownMenuItem>
                                                        )}
                                                        {showRequestReview && pendingCount > 0 && onReviewRequests && (
                                                            <DropdownMenuItem onClick={() => onReviewRequests(service)}>
                                                                <Package className="mr-2 h-4 w-4" />
                                                                Review Requests ({pendingCount})
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Mobile Cards */}
            <div className="space-y-3 md:hidden">
                {filteredServices.map((service) => {
                    const pendingCount = getPendingRequestCount(service);

                    return (
                        <Card
                            key={service.id}
                            className={`p-4 cursor-pointer hover:shadow-md transition-all border-l-4 ${service.status === 'open' ? 'border-l-blue-500' :
                                    service.status === 'pending' ? 'border-l-yellow-500' : 'border-l-green-500'
                                }`}
                            onClick={() => onView(service)}
                        >
                            {/* Header */}
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-medium">{service.serviceNumber}</span>
                                    {pendingCount > 0 && (
                                        <Badge variant="destructive" className="text-xs animate-pulse">
                                            <Package className="h-3 w-3 mr-1" />
                                            {pendingCount}
                                        </Badge>
                                    )}
                                </div>
                                {getStatusBadge(service.status)}
                            </div>

                            {/* Client */}
                            <p className="font-medium truncate mb-2">{service.clientName || 'Unknown'}</p>

                            {/* Type & Date */}
                            <div className="flex items-center gap-2 mb-3 flex-wrap text-xs">
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
                            </div>

                            {/* Problem Preview */}
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {service.problemDescription || 'No description'}
                            </p>

                            {/* Actions */}
                            <div
                                className="flex gap-2 flex-wrap border-t pt-3"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Button variant="outline" size="sm" className="flex-1" onClick={() => onView(service)}>
                                    <Info className="h-4 w-4 mr-1" />
                                    Details
                                </Button>
                                {showAttendActions && service.status !== 'closed' && onAttend && (
                                    <Button variant="default" size="sm" className="flex-1" onClick={() => onAttend(service)}>
                                        <Wrench className="h-4 w-4 mr-1" />
                                        Attend
                                    </Button>
                                )}
                                {showRequestReview && pendingCount > 0 && onReviewRequests && (
                                    <Button variant="destructive" size="sm" className="flex-1" onClick={() => onReviewRequests(service)}>
                                        <Package className="h-4 w-4 mr-1" />
                                        Review
                                    </Button>
                                )}
                                {service.status === 'closed' && !service.invoiceId && (
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                        onClick={() => router.push(`/invoices/invoices?serviceId=${service.id}`)}
                                    >
                                        <Receipt className="h-4 w-4 mr-1" />
                                        Generate Bill
                                    </Button>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* No Results */}
            {filteredServices.length === 0 && services.length > 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    No services found matching your criteria.
                </div>
            )}
        </div>
    );
}

export default ServiceList;
