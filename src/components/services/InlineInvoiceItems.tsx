/**
 * InlineInvoiceItems Component
 * Lightweight component for adding invoice line items during service attendance
 * Follows SOLID, KISS, DRY principles
 */

'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Product, InlineInvoiceItem } from '@/types';
import { formatCurrency } from '@/utils/formatters';

interface InlineInvoiceItemsProps {
    items: InlineInvoiceItem[];
    products: Product[];
    onChange: (items: InlineInvoiceItem[]) => void;
    companyState?: string;
    clientState?: string;
}

export function InlineInvoiceItems({
    items,
    products,
    onChange,
    companyState,
    clientState,
}: InlineInvoiceItemsProps) {

    // Add new empty row
    const handleAddItem = () => {
        onChange([
            ...items,
            { productId: '', quantity: 1, unitPrice: 0, discount: 0 }
        ]);
    };

    // Remove row
    const handleRemoveItem = (index: number) => {
        if (items.length === 1) return; // Keep at least one row
        onChange(items.filter((_, i) => i !== index));
    };

    // Update item field
    const handleItemChange = (index: number, field: keyof InlineInvoiceItem, value: any) => {
        const updatedItems = [...items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        onChange(updatedItems);
    };

    // Handle product selection - auto-fill fields
    const handleProductSelect = (index: number, productId: string) => {
        const product = products.find(p => p.id === productId);
        if (product) {
            const updatedItems = [...items];
            updatedItems[index] = {
                ...updatedItems[index],
                productId: product.id,
                productName: product.productName,
                description: product.description || '',
                hsn: product.hsn || '',
                unitPrice: product.price,
                unit: product.unit,
                gstRate: product.gstRate,
                discount: 0,
            };
            onChange(updatedItems);
        }
    };

    // Calculate line total
    const calculateLineTotal = (item: InlineInvoiceItem): number => {
        const baseAmount = item.quantity * item.unitPrice;
        const discountAmount = (baseAmount * (item.discount || 0)) / 100;
        return baseAmount - discountAmount;
    };

    // Calculate grand total
    const calculateGrandTotal = (): number => {
        return items.reduce((sum, item) => {
            if (!item.productId) return sum;
            const lineTotal = calculateLineTotal(item);
            const gstRate = item.gstRate || 0;
            const taxAmount = (lineTotal * gstRate) / 100;
            return sum + lineTotal + taxAmount;
        }, 0);
    };

    return (
        <div className="space-y-4">
            {/* Items List */}
            <div className="space-y-3">
                {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-muted/30 rounded-lg">
                        {/* Product Select */}
                        <div className="col-span-5">
                            {index === 0 && <Label className="text-xs">Product/Service</Label>}
                            <Select
                                value={item.productId}
                                onValueChange={(value) => handleProductSelect(index, value)}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select product..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map((product) => (
                                        <SelectItem key={product.id} value={product.id}>
                                            {product.productName} - {formatCurrency(product.price)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Quantity */}
                        <div className="col-span-2">
                            {index === 0 && <Label className="text-xs">Qty</Label>}
                            <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                className="h-9"
                            />
                        </div>

                        {/* Unit Price */}
                        <div className="col-span-2">
                            {index === 0 && <Label className="text-xs">Price</Label>}
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="h-9"
                            />
                        </div>

                        {/* Line Total */}
                        <div className="col-span-2">
                            {index === 0 && <Label className="text-xs">Total</Label>}
                            <div className="h-9 flex items-center text-sm font-medium">
                                {item.productId ? formatCurrency(calculateLineTotal(item)) : '-'}
                            </div>
                        </div>

                        {/* Remove Button */}
                        <div className="col-span-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(index)}
                                disabled={items.length === 1}
                                className="h-9 w-9 p-0"
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Item Button */}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="w-full"
            >
                <Plus className="h-4 w-4 mr-2" />
                Add Product/Service
            </Button>

            {/* Grand Total */}
            <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-sm font-medium">Estimated Total (incl. GST)</span>
                <span className="text-lg font-bold text-primary">
                    {formatCurrency(calculateGrandTotal())}
                </span>
            </div>

            <p className="text-xs text-muted-foreground">
                * Final invoice amount may vary based on tax calculations
            </p>
        </div>
    );
}
