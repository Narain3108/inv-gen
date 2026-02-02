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
import { Service, ServiceAttendData } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { FloatingLabelTextarea } from '@/components/ui/floating-label-textarea';
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
import SerialManager from '@/components/shared/SerialManager';

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
    const [quantity, setQuantity] = useState<number | ''>('');

    // Serial Manager Modal state
    const [serialModalOpen, setSerialModalOpen] = useState(false);
    const [serialModalPartIndex, setSerialModalPartIndex] = useState<number | null>(null);

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
            setQuantity('');
        }
    }, [open]);

    // Add part to list
    const handleAddPart = () => {
        const product = products.find(p => p.id === selectedProductId);
        if (!product) {
            toast.error('Please select a product');
            return;
        }

        const qtyNum = Number(quantity);
        if (!quantity || qtyNum < 1) {
            toast.error('Quantity must be at least 1');
            return;
        }

        setParts(prev => [...prev, {
            productId: product.id,
            productName: product.productName,
            hsn: product.hsn,
            quantity: qtyNum,
            unitPrice: product.price,
            unit: product.unit,
            gstRate: product.gstRate,
            serialNumbers: []
        }]);

        setSelectedProductId('');
        setQuantity('');
    };

    // Remove part from list
    const handleRemovePart = (index: number) => {
        setParts(prev => prev.filter((_, i) => i !== index));
    };

    // Update serial numbers for a part (from SerialManager)
    const handleSaveSerials = async (serials: string[]) => {
        if (serialModalPartIndex !== null) {
            setParts(prev => prev.map((p, i) => {
                if (i === serialModalPartIndex) {
                    return { ...p, serialNumbers: serials };
                }
                return p;
            }));
        }
        setSerialModalOpen(false);
        setSerialModalPartIndex(null);
    };

    // Open serial manager for a part
    const openSerialManager = (index: number) => {
        setSerialModalPartIndex(index);
        setSerialModalOpen(true);
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
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Attend Service - {service?.serviceNumber}</DialogTitle>
                        <DialogDescription>
                            Record your observation and solution
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-2">
                        {/* Observation - Floating Label Textarea */}
                        <FloatingLabelTextarea
                            id="observation"
                            label="Observation"
                            value={observation}
                            onChange={(e) => setObservation(e.target.value)}
                            rows={3}
                        />

                        {/* Action Taken - Floating Label Textarea */}
                        <FloatingLabelTextarea
                            id="actionTaken"
                            label="Action Taken / Solution"
                            value={actionTaken}
                            onChange={(e) => setActionTaken(e.target.value)}
                            rows={3}
                        />

                        {/* Parts Section */}
                        <div className="border-t pt-4">
                            <Label className="font-semibold text-base">
                                {isAdmin ? 'Parts Used' : 'Request Spare Parts'}
                            </Label>
                            <p className="text-xs text-muted-foreground mb-4">
                                {isAdmin
                                    ? 'Add parts you consumed (with serial numbers if applicable)'
                                    : 'Request parts from Admin for this service'
                                }
                            </p>

                            {/* Add Part - Stacked layout for clarity */}
                            <div className="space-y-3 mb-4">
                                <SearchableProductDropdown
                                    products={products}
                                    selectedProductId={selectedProductId}
                                    onProductSelect={(id) => setSelectedProductId(id)}
                                    placeholder="Search and select product..."
                                />
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="quantity" className="text-sm whitespace-nowrap">Quantity:</Label>
                                        <Input
                                            id="quantity"
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value))}
                                            className="w-20"
                                        />
                                    </div>
                                    <Button type="button" onClick={handleAddPart} size="sm">
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Part
                                    </Button>
                                </div>
                            </div>

                            {/* Parts List */}
                            {parts.length > 0 && (
                                <div className="space-y-2 bg-muted/50 p-3 rounded-lg">
                                    {parts.map((part, idx) => {
                                        const product = products.find(p => p.id === part.productId);
                                        const hasSerial = product?.hasSerialNumber === true;
                                        return (
                                            <div key={idx} className="flex items-center gap-2 bg-background p-3 rounded border">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">{part.productName}</p>
                                                    <p className="text-xs text-muted-foreground">Qty: {part.quantity}</p>
                                                </div>
                                                {isAdmin && hasSerial && (
                                                    <Button
                                                        type="button"
                                                        variant={part.serialNumbers.length < part.quantity ? 'outline' : 'secondary'}
                                                        size="sm"
                                                        className={`text-xs ${part.serialNumbers.length < part.quantity ? 'border-amber-400 text-amber-600' : 'text-green-600'}`}
                                                        onClick={() => openSerialManager(idx)}
                                                    >
                                                        {part.serialNumbers.length}/{part.quantity} Serials
                                                    </Button>
                                                )}
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemovePart(idx)}
                                                    className="shrink-0 h-8 w-8 text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Status Selection */}
                        <div className="border-t pt-4">
                            <Label className="font-semibold text-base mb-3 block">Was the issue resolved?</Label>
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant={isSolved ? "default" : "outline"}
                                    className={`flex-1 ${isSolved ? "bg-green-600 hover:bg-green-700" : ""}`}
                                    onClick={() => setIsSolved(true)}
                                >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Solved
                                </Button>
                                <Button
                                    type="button"
                                    variant={!isSolved ? "default" : "outline"}
                                    className={`flex-1 ${!isSolved ? "bg-yellow-600 hover:bg-yellow-700" : ""}`}
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
                                    <p className="text-xs text-red-500">
                                        Proof document is mandatory to mark as solved
                                    </p>
                                )}

                                {/* Create Invoice Switch */}
                                <div className="flex items-center space-x-3 bg-muted/30 p-3 rounded-lg border border-dashed border-primary/30">
                                    <Switch
                                        id="createInvoice"
                                        checked={createInvoiceAfterSolved}
                                        onCheckedChange={setCreateInvoiceAfterSolved}
                                    />
                                    <Label htmlFor="createInvoice" className="cursor-pointer font-medium text-sm">
                                        Create Invoice now related to this service
                                    </Label>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
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

            {/* Serial Manager Modal */}
            {serialModalPartIndex !== null && (
                <SerialManager
                    open={serialModalOpen}
                    onClose={() => {
                        setSerialModalOpen(false);
                        setSerialModalPartIndex(null);
                    }}
                    productId={parts[serialModalPartIndex]?.productId}
                    initialSelected={parts[serialModalPartIndex]?.serialNumbers || []}
                    quantity={parts[serialModalPartIndex]?.quantity || 0}
                    fetchFromDb={true}
                    onSave={handleSaveSerials}
                />
            )}
        </>
    );
}

export default ServiceAttendDialog;
