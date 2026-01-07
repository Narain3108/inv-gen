/**
 * FormItemsTable Component
 * Container for item rows with add functionality
 */

'use client';

import React from 'react';
import { Control } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Package } from 'lucide-react';
import { Product } from '@/types';
import { FormItemRow } from './FormItemRow';

interface ItemError {
    productId?: { message?: string };
    quantity?: { message?: string };
    unitPrice?: { message?: string };
}

interface FormItemsTableProps {
    fields: { id: string }[];
    control: Control<any>;
    products: Product[];
    companyId: string;
    watchItems: Array<{
        productId?: string;
        quantity?: number;
        unitPrice?: number;
        discount?: number;
        unit?: string;
    }>;
    onProductSelect: (index: number, productId: string) => void;
    onQuantityChange: (index: number, quantity: number) => void;
    onRemoveItem: (index: number) => void;
    onAddItem: () => void;
    onOpenSerialManager?: (index: number) => void;
    onProductAdded?: (product: Product) => void;
    serialNumbers?: Record<string, string[]>;
    serialNumberErrors?: Record<string, string>;
    errors?: Record<number, ItemError>;
    title?: string;
    showSerialButton?: boolean;
    className?: string;
}

export function FormItemsTable({
    fields,
    control,
    products,
    companyId,
    watchItems,
    onProductSelect,
    onQuantityChange,
    onRemoveItem,
    onAddItem,
    onOpenSerialManager,
    onProductAdded,
    serialNumbers = {},
    serialNumberErrors = {},
    errors = {},
    title = 'Items',
    showSerialButton = true,
    className = '',
}: FormItemsTableProps) {
    return (
        <Card className={`border-primary/20 shadow-sm ${className}`}>
            <CardHeader className="pb-2 pt-3 bg-gradient-to-r from-primary/5 to-accent/5 border-b">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {title}
                    </CardTitle>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={onAddItem}
                    >
                        <Plus className="h-3 w-3" />
                        Add Item
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-3 pb-3 space-y-3">
                {fields.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                        No items added yet. Click "Add Item" to get started.
                    </div>
                ) : (
                    fields.map((field, index) => (
                        <FormItemRow
                            key={field.id}
                            index={index}
                            fieldId={field.id}
                            control={control}
                            products={products}
                            companyId={companyId}
                            watchItem={watchItems[index] || {}}
                            onProductSelect={onProductSelect}
                            onQuantityChange={onQuantityChange}
                            onRemove={onRemoveItem}
                            onOpenSerialManager={onOpenSerialManager}
                            onProductAdded={onProductAdded}
                            serialNumbers={serialNumbers[field.id] || []}
                            serialNumberError={serialNumberErrors[field.id]}
                            canRemove={fields.length > 1}
                            error={errors[index]}
                            showSerialButton={showSerialButton}
                        />
                    ))
                )}
            </CardContent>
        </Card>
    );
}

export default FormItemsTable;
