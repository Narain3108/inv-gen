'use client';

/**
 * ServiceAttendDialog - Shared component for attending services
 * Used by both Admin (services/page.tsx) and Employee (my-tasks/page.tsx)
 * Adapts UI based on user role
 * Follows SOLID, KISS, DRY principles
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Plus, Trash2 } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useProductsQuery, useAttendServiceMutation } from '@/hooks/queries';
import { useCompany } from '@/hooks/useCompany';
import { Service, ServiceAttendData, UsedPart, SparePartRequest, Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { DocumentUpload } from '@/components/shared/DocumentUpload';
import { SearchableProductDropdown } from '@/components/shared/SearchableProductDropdown';

// ==================== Types ====================

interface ServiceAttendDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    service: Service | null;
    onSuccess?: () => void;
}

interface PartItem {
    productId: string;
    productName: string;
    hsn?: string;
    quantity: number;
    unitPrice: number;
    unit?: string;
    gstRate?: number;
    serialNumbers: string[];
}

// ==================== Component ====================

export function ServiceAttendDialog({
    open,
    onOpenChange,
    service,
    onSuccess
}: ServiceAttendDialogProps) {
    const router = useRouter();
    const { user } = useAuth();
    const { selectedCompany } = useCompany();
    const attendMutation = useAttendServiceMutation();

    const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

    // Form state
    const [observation, setObservation] = useState('');
    const [actionTaken, setActionTaken] = useState('');
    const [isSolved, setIsSolved] = useState(false);
    const [proofDocumentUrl, setProofDocumentUrl] = useState('');
    const [createInvoiceAfterSolved, setCreateInvoiceAfterSolved] = useState(false);

    // Parts state
    const [parts, setParts] = useState<PartItem[]>([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState(1);

    // Products for dropdown
    const { data: products = [] } = useProductsQuery(selectedCompany?.id);

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setObservation('');
            setActionTaken('');
            setIsSolved(false);
            setProofDocumentUrl('');
            setCreateInvoiceAfterSolved(false);
            setParts([]);
            setSelectedProductId('');
            setQuantity(1);
        }
    }, [open]);

    // Add part to list
    const handleAddPart = () => {
        const product = products.find(p => p.id === selectedProductId);
        if (!product) {
            toast.error('Please select a product');
            return;
        }
        if (quantity < 1) {
            toast.error('Quantity must be at least 1');
            return;
        }

        setParts(prev => [...prev, {
            productId: product.id,
            productName: product.productName,
            hsn: product.hsn,
            quantity,
            unitPrice: product.price,
            unit: product.unit,
            gstRate: product.gstRate,
            serialNumbers: []
        }]);

        setSelectedProductId('');
        setQuantity(1);
    };

    // Remove part from list
    const handleRemovePart = (index: number) => {
        setParts(prev => prev.filter((_, i) => i !== index));
    };

    // Update serial numbers for a part
    const handleSerialChange = (index: number, value: string) => {
        setParts(prev => prev.map((p, i) => {
            if (i === index) {
                return { ...p, serialNumbers: value.split(',').map(s => s.trim()).filter(Boolean) };
            }
            return p;
        }));
    };

    // Submit form
    const handleSubmit = async () => {
        if (!service) return;

        // Validate proof document for solved status
        if (isSolved && !proofDocumentUrl) {
            toast.error('Please upload proof document before marking as solved');
            return;
        }

        // Build attend data
        const attendData: ServiceAttendData = {
            observation,
            actionTaken,
            isSolved,
            proofDocumentUrl: proofDocumentUrl || undefined,
        };

        // Add parts based on role
        if (parts.length > 0) {
            if (isAdmin) {
                // Admin: Direct consumption with serial numbers
                attendData.usedParts = parts.map(p => ({
                    productId: p.productId,
                    productName: p.productName,
                    hsn: p.hsn,
                    quantity: p.quantity,
                    unitPrice: p.unitPrice,
                    unit: p.unit,
                    gstRate: p.gstRate,
                    serialNumbers: p.serialNumbers.length > 0 ? p.serialNumbers : undefined
                }));
            } else {
                // Employee: Request parts (no serial numbers)
                attendData.sparePartRequests = parts.map(p => ({
                    productId: p.productId,
                    productName: p.productName,
                    hsn: p.hsn,
                    quantity: p.quantity,
                    unitPrice: p.unitPrice,
                    unit: p.unit,
                    gstRate: p.gstRate,
                    status: 'pending' as const
                }));
            }
        }

        attendMutation.mutate(
            { id: service.id, data: attendData },
            {
                onSuccess: () => {
                    onOpenChange(false);
                    onSuccess?.();

                    // Redirect to invoice creation if selected
                    if (isSolved && createInvoiceAfterSolved) {
                        router.push(`/invoices/invoices?createFor=${service.id}`);
                    }
                },
                onError: (error) => {
                    console.error('Error attending service:', error);
                    toast.error('Failed to update service');
                },
            }
        );
    };

    const submitting = attendMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Attend Service - {service?.serviceNumber}</DialogTitle>
                    <DialogDescription>
                        Record your observation and solution
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Observation */}
                    <div>
                        <Label htmlFor="observation">Observation</Label>
                        <Textarea
                            id="observation"
                            placeholder="What did you observe on site?"
                            value={observation}
                            onChange={(e) => setObservation(e.target.value)}
                        />
                    </div>

                    {/* Action Taken */}
                    <div>
                        <Label htmlFor="actionTaken">Action Taken / Solution</Label>
                        <Textarea
                            id="actionTaken"
                            placeholder="What action did you take to resolve the issue?"
                            value={actionTaken}
                            onChange={(e) => setActionTaken(e.target.value)}
                        />
                    </div>

                    {/* Parts Section */}
                    <div className="border-t pt-4">
                        <Label className="font-semibold">
                            {isAdmin ? 'Parts Used' : 'Request Spare Parts'}
                        </Label>
                        <p className="text-xs text-muted-foreground mb-2">
                            {isAdmin
                                ? 'Add parts you consumed (with serial numbers if applicable)'
                                : 'Request parts from Admin for this service'
                            }
                        </p>

                        {/* Add Part Row */}
                        <div className="flex gap-2 mb-2">
                            <div className="flex-1">
                                <SearchableProductDropdown
                                    products={products}
                                    selectedProductId={selectedProductId}
                                    onProductSelect={(id) => setSelectedProductId(id)}
                                    placeholder="Select product"
                                />
                            </div>
                            <Input
                                type="number"
                                min={1}
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                className="w-20"
                                placeholder="Qty"
                            />
                            <Button type="button" size="sm" onClick={handleAddPart}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Parts List */}
                        {parts.length > 0 && (
                            <div className="space-y-2 bg-muted/50 p-2 rounded">
                                {parts.map((part, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-background p-2 rounded text-sm">
                                        <div className="flex-1">
                                            <span className="font-medium">{part.productName}</span>
                                            <span className="text-muted-foreground ml-2">x{part.quantity}</span>
                                        </div>
                                        {isAdmin && (
                                            <Input
                                                type="text"
                                                placeholder="Serial #s (comma sep)"
                                                value={part.serialNumbers.join(', ')}
                                                onChange={(e) => handleSerialChange(idx, e.target.value)}
                                                className="w-40 text-xs"
                                            />
                                        )}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemovePart(idx)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Status Selection */}
                    <div>
                        <Label>Was the issue resolved?</Label>
                        <div className="flex gap-4 mt-2">
                            <Button
                                type="button"
                                variant={isSolved ? "default" : "outline"}
                                className={isSolved ? "bg-green-600 hover:bg-green-700" : ""}
                                onClick={() => setIsSolved(true)}
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Solved
                            </Button>
                            <Button
                                type="button"
                                variant={!isSolved ? "default" : "outline"}
                                className={!isSolved ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                                onClick={() => setIsSolved(false)}
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Not Solved
                            </Button>
                        </div>
                    </div>

                    {/* Proof Document Upload - Required for Solved */}
                    {isSolved && (
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
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || (isSolved && !proofDocumentUrl)}
                    >
                        {submitting ? 'Submitting...' : 'Submit'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ServiceAttendDialog;
