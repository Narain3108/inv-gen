/**
 * InvoicePageHeader Component
 * Header section with title, description, and action buttons
 * Following Single Responsibility Principle
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ExportButton } from '@/components/shared';
import { Plus, Settings } from 'lucide-react';

interface InvoicePageHeaderProps {
    onAddInvoice: () => void;
    onOpenCustomization: () => void;
    onExportExcel: () => Promise<boolean>;
    onExportCSV: () => Promise<boolean>;
}

export function InvoicePageHeader({
    onAddInvoice,
    onOpenCustomization,
    onExportExcel,
    onExportCSV,
}: InvoicePageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Invoices</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                    Create and manage your invoices
                </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <ExportButton
                    onExportExcel={onExportExcel}
                    onExportCSV={onExportCSV}
                    className="flex-1 sm:flex-none"
                />
                <Button
                    variant="outline"
                    onClick={onOpenCustomization}
                    className="flex-1 sm:flex-none"
                >
                    <Settings className="mr-2 h-4 w-4" />
                    <span className="whitespace-nowrap">Customize Bill</span>
                </Button>
                <Button onClick={onAddInvoice} className="flex-1 sm:flex-none">
                    <Plus className="mr-2 h-4 w-4" />
                    <span className="whitespace-nowrap">New Invoice</span>
                </Button>
            </div>
        </div>
    );
}

export default InvoicePageHeader;
