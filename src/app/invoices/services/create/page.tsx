'use client';

/**
 * Create Service Page - Standardized
 * Form for creating a new service call
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { servicesApi, clientsApi } from '@/lib/api';
import { usersApi } from '@/lib/api/users.api';
import { queryKeys } from '@/lib/query';
import { serviceFormSchema, ServiceFormValues } from '@/lib/validations';
import { Client, User, ServiceType } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { FloatingLabelTextarea } from '@/components/ui/floating-label-textarea';
import { FloatingLabelSelect } from '@/components/ui/floating-label-select';
import { SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/components/layout';
import { SearchableClientDropdown } from '@/components/shared/SearchableClientDropdown';
import { INDIAN_STATES } from '@/lib/constants';

// ==================== Service Type Options ====================
const serviceTypeOptions: { value: ServiceType; label: string }[] = [
    { value: 'warranty', label: 'Warranty' },
    { value: 'per_call', label: 'Per Call' },
    { value: 'amc', label: 'AMC' },
    { value: 'new_installation', label: 'New Installation' },
];

function CreateServiceContent() {
    const router = useRouter();
    const { selectedCompany } = useCompany();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [clients, setClients] = useState<Client[]>([]);
    const [employees, setEmployees] = useState<User[]>([]);
    const [generatedNumber, setGeneratedNumber] = useState('');
    const [activeTab, setActiveTab] = useState('details');

    const form = useForm<ServiceFormValues>({
        resolver: zodResolver(serviceFormSchema) as any,
        defaultValues: {
            callDate: new Date().toISOString().split('T')[0],
            serviceType: 'per_call',
            problemDescription: '',
            useClientAddress: true,
            assignedDate: new Date().toISOString().split('T')[0],
            assignedTime: '10:00',
            assignedToIds: [],
        }
    });

    const { register, handleSubmit, setValue, watch, control, trigger, formState: { errors, isSubmitting } } = form;

    const watchUseClientAddress = watch('useClientAddress');
    const watchAssignedToIds = watch('assignedToIds') || [];

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            if (!selectedCompany?.id) return;
            try {
                const [clientsData, usersData, numberData] = await Promise.all([
                    clientsApi.getAll({ company_id: selectedCompany.id }),
                    usersApi.getAll(),
                    servicesApi.generateNumber(selectedCompany.id),
                ]);
                setClients(clientsData);
                const companyEmployees = usersData.filter(
                    (u: User) => u.role === 'employee' &&
                        (u.allowedCompanyIds?.includes(selectedCompany.id) || u.allowedCompanyIds?.length === 0)
                );
                setEmployees(companyEmployees);
                setGeneratedNumber(numberData.service_number);
            } catch (error) {
                console.error('Error loading data:', error);
                toast.error('Failed to load initial data');
            }
        };
        loadData();
    }, [selectedCompany?.id]);

    // Handle employee toggle
    const toggleEmployee = (employeeId: string) => {
        const currentIds = watchAssignedToIds;
        const newIds = currentIds.includes(employeeId)
            ? currentIds.filter(id => id !== employeeId)
            : [...currentIds, employeeId];
        setValue('assignedToIds', newIds, { shouldValidate: true });
    };

    const onSubmit = async (data: ServiceFormValues) => {
        if (!selectedCompany?.id) return;
        try {
            await servicesApi.create({
                companyId: selectedCompany.id,
                clientId: data.clientId,
                callDate: new Date(data.callDate),
                serviceType: data.serviceType as ServiceType,
                problemDescription: data.problemDescription,
                initialSolution: data.initialSolution || undefined,
                useClientAddress: data.useClientAddress,
                serviceAddress: data.useClientAddress ? undefined : data.serviceAddress as any,
                assignedToIds: data.assignedToIds,
                assignedDate: new Date(data.assignedDate),
                assignedTime: data.assignedTime,
            });

            toast.success('Service created successfully');
            queryClient.invalidateQueries({ queryKey: queryKeys.services.byCompany(selectedCompany.id) });
            router.push('/invoices/services');
        } catch (error) {
            console.error('Failed to create service', error);
            toast.error('Failed to create service');
        }
    };

    const tabsOrder = ['details', 'address', 'assignment'];
    const goToNext = async (e?: React.MouseEvent) => {
        e?.preventDefault();
        let fieldsToValidate: any[] = [];
        if (activeTab === 'details') fieldsToValidate = ['clientId', 'serviceType', 'callDate', 'problemDescription'];
        if (activeTab === 'address' && !watchUseClientAddress) fieldsToValidate = ['serviceAddress'];

        if (await trigger(fieldsToValidate)) {
            const idx = tabsOrder.indexOf(activeTab);
            if (idx < tabsOrder.length - 1) setActiveTab(tabsOrder[idx + 1]);
        }
    };

    const goBack = (e?: React.MouseEvent) => {
        e?.preventDefault();
        const idx = tabsOrder.indexOf(activeTab);
        if (idx > 0) setActiveTab(tabsOrder[idx - 1]);
    };

    if (!selectedCompany) return <div className="p-8 text-center">Please select a company</div>;

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Create Service</h1>
                    <p className="text-sm text-muted-foreground">Service #{generatedNumber}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="address">Address</TabsTrigger>
                        <TabsTrigger value="assignment">Assignment</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="mt-4 space-y-4">
                        <Card>
                            <CardHeader><CardTitle>Service Details</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <SearchableClientDropdown
                                        clients={clients}
                                        selectedClientId={watch('clientId') || ''}
                                        onClientSelect={(id) => setValue('clientId', id, { shouldValidate: true })}
                                        label="Client *"
                                        error={errors.clientId?.message}
                                        companyId={selectedCompany.id}
                                    />
                                    <FloatingLabelSelect
                                        id="serviceType"
                                        label="Service Type *"
                                        value={watch('serviceType')}
                                        onValueChange={(val) => setValue('serviceType', val as any)}
                                        error={errors.serviceType?.message}
                                    >
                                        <SelectContent>
                                            {serviceTypeOptions.map(opt => (
                                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </FloatingLabelSelect>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FloatingLabelInput
                                        id="callDate"
                                        type="date"
                                        label="Call Date *"
                                        {...register('callDate')}
                                        error={errors.callDate?.message}
                                    />
                                </div>
                                <FloatingLabelTextarea
                                    id="problemDescription"
                                    label="Problem Description *"
                                    {...register('problemDescription')}
                                    error={errors.problemDescription?.message}
                                    rows={3}
                                />
                                <FloatingLabelTextarea
                                    id="initialSolution"
                                    label="Initial Solution (Optional)"
                                    {...register('initialSolution')}
                                    rows={2}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="address" className="mt-4 space-y-4">
                        <Card>
                            <CardHeader><CardTitle>Service Location</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-2 mb-4">
                                    <input
                                        type="checkbox"
                                        id="useClientAddress"
                                        checked={watchUseClientAddress}
                                        onChange={(e) => setValue('useClientAddress', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary"
                                    />
                                    <Label htmlFor="useClientAddress">Use data from Client Profile</Label>
                                </div>

                                {!watchUseClientAddress && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                        <FloatingLabelTextarea
                                            id="serviceAddress.street"
                                            label="Street Address *"
                                            {...register('serviceAddress.street')}
                                            rows={2}
                                            error={errors.serviceAddress?.street?.message}
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FloatingLabelInput
                                                id="serviceAddress.city"
                                                label="City *"
                                                {...register('serviceAddress.city')}
                                                error={errors.serviceAddress?.city?.message}
                                            />
                                            <FloatingLabelSelect
                                                id="serviceAddress.state"
                                                label="State *"
                                                value={watch('serviceAddress.state') || ''}
                                                onValueChange={(val) => setValue('serviceAddress.state', val)}
                                                error={errors.serviceAddress?.state?.message}
                                            >
                                                <SelectContent>
                                                    {INDIAN_STATES.map(st => (
                                                        <SelectItem key={st.code} value={st.value}>{st.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </FloatingLabelSelect>
                                        </div>
                                        <FloatingLabelInput
                                            id="serviceAddress.pincode"
                                            label="Pincode *"
                                            {...register('serviceAddress.pincode')}
                                            maxLength={6}
                                            error={errors.serviceAddress?.pincode?.message}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="assignment" className="mt-4 space-y-4">
                        <Card>
                            <CardHeader><CardTitle>Assignment</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FloatingLabelInput
                                        id="assignedDate"
                                        type="date"
                                        label="Assigned Date *"
                                        {...register('assignedDate')}
                                        error={errors.assignedDate?.message}
                                    />
                                    <FloatingLabelInput
                                        id="assignedTime"
                                        type="time"
                                        label="Assigned Time *"
                                        {...register('assignedTime')}
                                        error={errors.assignedTime?.message}
                                    />
                                </div>

                                <div>
                                    <Label className="mb-2 block">Assign Employees *</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {employees.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">No employees available</p>
                                        ) : (
                                            employees.map((emp) => (
                                                <div
                                                    key={emp.id}
                                                    className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${watchAssignedToIds.includes(emp.id) ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                                                        }`}
                                                    onClick={() => toggleEmployee(emp.id)}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${watchAssignedToIds.includes(emp.id) ? 'bg-primary border-primary' : 'border-gray-400'
                                                        }`}>
                                                        {watchAssignedToIds.includes(emp.id) && <span className="text-white text-xs">✓</span>}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{emp.name}</p>
                                                        <p className="text-xs text-muted-foreground">{emp.email}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    {errors.assignedToIds && <p className="text-destructive text-xs mt-1">{errors.assignedToIds.message}</p>}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-between pt-4 border-t">
                    <div>
                        {activeTab !== 'details' && (
                            <Button type="button" variant="outline" onClick={goBack}>Back</Button>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                        {activeTab !== 'assignment' ? (
                            <Button type="button" onClick={goToNext} className="bg-gradient-to-r from-primary/20 to-accent/20 text-primary">Next</Button>
                        ) : (
                            <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30">
                                {isSubmitting ? 'Creating...' : 'Create Service'}
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}

export default function CreateServicePage() {
    return (
        <DashboardLayout>
            <CreateServiceContent />
        </DashboardLayout>
    );
}
