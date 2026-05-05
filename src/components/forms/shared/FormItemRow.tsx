/**
 * FormItemRow Component
 * Single item row for invoice/quotation/purchase forms
 */

'use client';

import React from 'react';
import { Controller, Control } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trash2, Package, Hash } from 'lucide-react';
import { Product } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { SearchableProductDropdown } from '@/components/shared/SearchableProductDropdown';

interface FormItemRowProps {
    index: number;
    fieldId: string;
    control: Control<any>;
    products: Product[];
    companyId: string;
    watchItem: {
        productId?: string;
        quantity?: number;
        unitPrice?: number;
        discount?: number;
        unit?: string;
    };
    onProductSelect: (index: number, productId: string) => void;
    onQuantityChange: (index: number, quantity: number) => void;
    onRemove: (index: number) => void;
    onOpenSerialManager?: (index: number) => void;
    onProductAdded?: (product: Product) => void;
    serialNumbers?: string[];
    serialNumberError?: string;
    canRemove?: boolean;
    error?: {
        productId?: { message?: string };
        quantity?: { message?: string };
        unitPrice?: { message?: string };
    };
    showSerialButton?: boolean;
    isCompact?: boolean;
}

export function FormItemRow({
    index,
    fieldId,
    control,
    products,
    companyId,
    watchItem,
    onProductSelect,
    onQuantityChange,
    onRemove,
    onOpenSerialManager,
    onProductAdded,
    serialNumbers = [],
    serialNumberError,
    canRemove = true,
    error,
    showSerialButton = true,
    isCompact = false,
}: FormItemRowProps) {
    const product = products.find((p) => p.id === watchItem?.productId);
    const quantity = Number(watchItem?.quantity) || 0;
    const unitPrice = Number(watchItem?.unitPrice) || 0;
    const discount = Number(watchItem?.discount) || 0;

    // Calculate line total
    const baseAmount = quantity * unitPrice;
    const discountAmount = (baseAmount * discount) / 100;
    const lineTotal = baseAmount - discountAmount;

    // Check if product has serial numbers
    const hasSerialNumbers = product?.hasSerialNumber === true;
    const requiredSerials = hasSerialNumbers ? quantity : 0;
    const currentSerials = serialNumbers.length;

    return (
        <div className={`border rounded-lg p-3 bg-card hover:shadow-sm transition-shadow ${serialNumberError ? 'border-red-300 bg-red-50/30' : ''}`}>
            {/* Row Header with Delete Button */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    Item {index + 1}
                </span>
                {canRemove && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => onRemove(index)}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>

            {/* Product Selection */}
            <div className="space-y-3">
                <SearchableProductDropdown
                    products={products}
                    selectedProductId={product?.id}
                    onProductSelect={(productId, selectedProduct) => {
                        if (selectedProduct) {
                            onProductSelect(index, selectedProduct.id);
                        }
                    }}
                    onProductAdded={onProductAdded}
                    companyId={companyId}
                    placeholder="Select product..."
                    error={error?.productId?.message}
                />

                {/* Quantity, Price, Discount Row */}
                <div className={`grid gap-2 ${isCompact ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 md:grid-cols-4'}`}>
                    {/* Quantity */}
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Qty</Label>
                        <Controller
                            name={`items.${index}.quantity`}
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="number"
                                    min="1"
                                    step="1"
                                    className="h-8 text-sm"
                                    {...field}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        field.onChange(val);
                                        onQuantityChange(index, val);
                                    }}
                                />
                            )}
                        />
                        {error?.quantity?.message && (
                            <p className="text-xs text-red-500">{error.quantity.message}</p>
                        )}
                    </div>

                    {/* Unit Price */}
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Price (₹)</Label>
                        <Controller
                            name={`items.${index}.unitPrice`}
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="h-8 text-sm"
                                    {...field}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '') {
                                            field.onChange(0);
                                        } else {
                                            field.onChange(Number(val));
                                        }
                                    }}
                                />
                            )}
                        />
                    </div>

                    {/* Discount */}
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Discount %</Label>
                        <Controller
                            name={`items.${index}.discount`}
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    className="h-8 text-sm"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                            )}
                        />
                    </div>

                    {/* Line Total */}
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Total</Label>
                        <div className="h-8 px-2 flex items-center text-sm font-medium bg-muted/50 rounded border">
                            {formatCurrency(lineTotal)}
                        </div>
                    </div>
                </div>

                {/* Product Info & Serial Number Button */}
                {product && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 px-2 py-1.5 rounded">
                        <div className="flex items-center gap-3">
                            {product.hsn && <span>HSN: {product.hsn}</span>}
                            <span>GST: {product.gstRate}%</span>
                            {product.type === 'product' && product.stock !== undefined && (
                                <span className={product.stock < quantity ? 'text-red-500' : ''}>
                                    Stock: {product.stock}
                                </span>
                            )}
                        </div>

                        {/* Serial Number Button */}
                        {showSerialButton && hasSerialNumbers && (
                            <Button
                                type="button"
                                variant={currentSerials < requiredSerials ? 'outline' : 'secondary'}
                                size="sm"
                                className={`h-6 text-xs gap-1 ${currentSerials < requiredSerials ? 'border-amber-400 text-amber-600' : 'text-green-600'}`}
                                onClick={() => onOpenSerialManager?.(index)}
                            >
                                <Hash className="h-3 w-3" />
                                {currentSerials}/{requiredSerials} Serials
                            </Button>
                        )}
                    </div>
                )}

                {/* Serial Number Error */}
                {serialNumberError && (
                    <p className="text-xs text-red-500 px-1">{serialNumberError}</p>
                )}
            </div>
        </div>
    );
}

export default FormItemRow;
