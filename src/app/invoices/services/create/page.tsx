'use client';

/**
 * Create Service Page - Admin Form
 * Form for creating a new service call
 * Follows SOLID, KISS, DRY principles
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { servicesApi, clientsApi } from '@/lib/api';
import { usersApi } from '@/lib/api/users.api';
import { ServiceFormData, ServiceType, Client, User, Address } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/components/layout';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

// ==================== Service Type Options ====================

const serviceTypeOptions: { value: ServiceType; label: string }[] = [
    { value: 'warranty', label: 'Warranty' },
    { value: 'per_call', label: 'Per Call' },
    { value: 'amc', label: 'AMC' },
    { value: 'new_installation', label: 'New Installation' },
];

// ==================== Main Content Component ====================

function CreateServiceContent() {
    const router = useRouter();
    const { selectedCompany } = useCompany();
    const { user } = useAuth();

    // Data state
    const [clients, setClients] = useState<Client[]>([]);
    const [employees, setEmployees] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [generatedNumber, setGeneratedNumber] = useState('');

    // Form state
    const [form, setForm] = useState<Partial<ServiceFormData>>({
        clientId: '',
        callDate: new Date(),
        serviceType: 'per_call',
        problemDescription: '',
        initialSolution: '',
        useClientAddress: true,
        serviceAddress: { street: '', city: '', state: '', pincode: '' },
        assignedToIds: [],
        assignedDate: new Date(),
        assignedTime: '10:00',
    });

    // Selected employee IDs
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            if (!selectedCompany?.id) return;

            setLoading(true);
            try {
                // Load clients and employees in parallel
                const [clientsData, usersData, numberData] = await Promise.all([
                    clientsApi.getAll({ company_id: selectedCompany.id }),
                    usersApi.getAll(),
                    servicesApi.generateNumber(selectedCompany.id),
                ]);

                setClients(clientsData);
                // Filter only employees with access to this company
                const companyEmployees = usersData.filter(
                    (u: User) => u.role === 'employee' &&
                        (u.allowedCompanyIds?.includes(selectedCompany.id) || u.allowedCompanyIds?.length === 0)
                );
                setEmployees(companyEmployees);
                setGeneratedNumber(numberData.service_number);
            } catch (error) {
                console.error('Error loading data:', error);
                toast.error('Failed to load form data');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [selectedCompany?.id]);

    // RBAC: Redirect employees
    useEffect(() => {
        if (user?.role === 'employee') {
            router.push('/invoices/my-tasks');
        }
    }, [user, router]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedCompany?.id || !form.clientId) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (selectedEmployees.length === 0) {
            toast.error('Please assign at least one employee');
            return;
        }

        setSubmitting(true);
        try {
            await servicesApi.create({
                companyId: selectedCompany.id,
                clientId: form.clientId,
                callDate: form.callDate!,
                serviceType: form.serviceType as ServiceType,
                problemDescription: form.problemDescription || '',
                initialSolution: form.initialSolution,
                useClientAddress: form.useClientAddress ?? true,
                serviceAddress: form.useClientAddress ? undefined : form.serviceAddress as Address,
                assignedToIds: selectedEmployees,
                assignedDate: form.assignedDate!,
                assignedTime: form.assignedTime || '10:00',
            });

            toast.success('Service created successfully!');
            router.push('/invoices/services');
        } catch (error) {
            console.error('Error creating service:', error);
            toast.error('Failed to create service');
        } finally {
            setSubmitting(false);
        }
    };

    // Toggle employee selection
    const toggleEmployee = (employeeId: string) => {
        setSelectedEmployees((prev) =>
            prev.includes(employeeId)
                ? prev.filter((id) => id !== employeeId)
                : [...prev, employeeId]
        );
    };

    // No company selected state
    if (!selectedCompany) {
        return (
            <div className="space-y-6 p-6">
                <div className="rounded-lg border border-dashed p-12 text-center">
                    <p className="text-muted-foreground">Please select a company first</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Create Service</h1>
                    <p className="text-sm text-muted-foreground">Service Number: {generatedNumber}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Call Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Call Details</CardTitle>
                        <CardDescription>Information about the service call</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="client">Client *</Label>
                            <Select
                                value={form.clientId}
                                onValueChange={(value) => setForm({ ...form, clientId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a client" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map((client) => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.clientName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="serviceType">Service Type *</Label>
                            <Select
                                value={form.serviceType}
                                onValueChange={(value) => setForm({ ...form, serviceType: value as ServiceType })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {serviceTypeOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="callDate">Call Date *</Label>
                            <Input
                                type="date"
                                value={form.callDate ? new Date(form.callDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => setForm({ ...form, callDate: new Date(e.target.value) })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <Label htmlFor="problemDescription">Problem Description * (max 50 words)</Label>
                            <Textarea
                                id="problemDescription"
                                placeholder="Describe the issue reported by the client..."
                                value={form.problemDescription}
                                onChange={(e) => setForm({ ...form, problemDescription: e.target.value })}
                                maxLength={500}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <Label htmlFor="initialSolution">Initial Solution (Optional)</Label>
                            <Textarea
                                id="initialSolution"
                                placeholder="Any known solution or troubleshooting steps..."
                                value={form.initialSolution}
                                onChange={(e) => setForm({ ...form, initialSolution: e.target.value })}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Service Address */}
                <Card>
                    <CardHeader>
                        <CardTitle>Service Address</CardTitle>
                        <CardDescription>Location where service will be performed</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="useClientAddress"
                                checked={form.useClientAddress ?? true}
                                onChange={(e) => setForm({ ...form, useClientAddress: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <Label htmlFor="useClientAddress">Use client&apos;s address</Label>
                        </div>

                        {!form.useClientAddress && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <Label>Street Address</Label>
                                    <Input
                                        placeholder="Street address"
                                        value={form.serviceAddress?.street || ''}
                                        onChange={(e) => setForm({
                                            ...form,
                                            serviceAddress: { ...form.serviceAddress, street: e.target.value } as Address
                                        })}
                                    />
                                </div>
                                <div>
                                    <Label>City</Label>
                                    <Input
                                        placeholder="City"
                                        value={form.serviceAddress?.city || ''}
                                        onChange={(e) => setForm({
                                            ...form,
                                            serviceAddress: { ...form.serviceAddress, city: e.target.value } as Address
                                        })}
                                    />
                                </div>
                                <div>
                                    <Label>State</Label>
                                    <Input
                                        placeholder="State"
                                        value={form.serviceAddress?.state || ''}
                                        onChange={(e) => setForm({
                                            ...form,
                                            serviceAddress: { ...form.serviceAddress, state: e.target.value } as Address
                                        })}
                                    />
                                </div>
                                <div>
                                    <Label>Pincode</Label>
                                    <Input
                                        placeholder="Pincode"
                                        value={form.serviceAddress?.pincode || ''}
                                        onChange={(e) => setForm({
                                            ...form,
                                            serviceAddress: { ...form.serviceAddress, pincode: e.target.value } as Address
                                        })}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Assignment */}
                <Card>
                    <CardHeader>
                        <CardTitle>Assignment</CardTitle>
                        <CardDescription>Assign employees to this service</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Assigned Date *</Label>
                                <Input
                                    type="date"
                                    value={form.assignedDate ? new Date(form.assignedDate).toISOString().split('T')[0] : ''}
                                    onChange={(e) => setForm({ ...form, assignedDate: new Date(e.target.value) })}
                                />
                            </div>
                            <div>
                                <Label>Assigned Time *</Label>
                                <Input
                                    type="time"
                                    value={form.assignedTime}
                                    onChange={(e) => setForm({ ...form, assignedTime: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Select Employees *</Label>
                            <p className="text-sm text-muted-foreground mb-2">
                                Choose one or more employees to assign this service
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {employees.length === 0 ? (
                                    <p className="text-sm text-muted-foreground col-span-full">
                                        No employees available. Please add employees first.
                                    </p>
                                ) : (
                                    employees.map((emp) => (
                                        <div
                                            key={emp.id}
                                            className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${selectedEmployees.includes(emp.id)
                                                ? 'bg-primary/10 border-primary'
                                                : 'hover:bg-muted'
                                                }`}
                                            onClick={() => toggleEmployee(emp.id)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedEmployees.includes(emp.id)}
                                                onChange={() => toggleEmployee(emp.id)}
                                                className="h-4 w-4 rounded border-gray-300"
                                            />
                                            <div>
                                                <p className="font-medium text-sm">{emp.name}</p>
                                                <p className="text-xs text-muted-foreground">{emp.email}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Create Service
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}

// ==================== Export with DashboardLayout ====================

export default function CreateServicePage() {
    return (
        <DashboardLayout>
            <CreateServiceContent />
        </DashboardLayout>
    );
}
