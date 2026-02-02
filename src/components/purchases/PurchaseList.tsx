/**
 * Purchase List Component
 * Displays purchase bills in a responsive table (desktop) and cards (mobile)
 * Follows InvoiceList.tsx pattern for UI consistency
 */

'use client';

import React, { useState } from 'react';
import { PurchaseBill } from '@/lib/api/purchases.api';
import { Client } from '@/types';
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
    Edit,
    Eye,
    FileText,
    MoreVertical,
    Search,
    Trash2,
    Package,
    Calendar,
    Download
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { resolveVendorName } from '@/utils/vendor';
import { EmptyState } from '@/components/ui/empty-state';

// ==================== Types ====================

interface PurchaseListProps {
    purchases: PurchaseBill[];
    clients: Client[];
    onView: (purchase: PurchaseBill) => void;
    onEdit: (purchase: PurchaseBill) => void;
    onDelete: (purchase: PurchaseBill) => void;
    canEdit?: boolean;
}

// ==================== Helper Functions ====================

const getDisplayNumber = (bill: PurchaseBill): string => {
    const b = bill as any;
    return b.invoiceNumber || b.billNumber || b.invoice_number || b.bill_number || '-';
};

const getDisplayDate = (bill: PurchaseBill): string => {
    const b = bill as any;
    return b.billDate || b.date || b.bill_date || '';
};

const getRefNumber = (bill: PurchaseBill): string | undefined => {
    const b = bill as any;
    return b.referenceNumber || b.reference_number || b.ref_number;
};

const getPoNumber = (bill: PurchaseBill): string | undefined => {
    const b = bill as any;
    return b.poNumber || b.po_number;
};

// ==================== Component ====================

export function PurchaseList({
    purchases,
    clients,
    onView,
    onEdit,
    onDelete,
    canEdit = false,
}: PurchaseListProps) {
    const [searchTerm, setSearchTerm] = useState('');

    // Filter purchases by search term
    const filteredPurchases = purchases.filter((bill) => {
        const displayNumber = getDisplayNumber(bill);
        const resolved = resolveVendorName(bill, clients, displayNumber);
        const vendorName = resolved.vendorName.toLowerCase();

        return (
            displayNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vendorName.includes(searchTerm.toLowerCase())
        );
    });

    // Empty state
    if (purchases.length === 0) {
        return (
            <EmptyState
                title="No Purchase Bills Yet"
                description="Add your first purchase bill to track inventory and expenses."
                icon={FileText}
            />
        );
    }

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by bill number or vendor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-card"
                    />
                </div>
            </div>

            {/* Desktop Table */}
            <Card className="overflow-hidden hidden md:block">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="p-3 text-left text-sm font-medium">Bill #</th>
                                <th className="p-3 text-left text-sm font-medium">Vendor</th>
                                <th className="p-3 text-left text-sm font-medium">Date</th>
                                <th className="p-3 text-center text-sm font-medium">Items</th>
                                <th className="p-3 text-right text-sm font-medium">Amount</th>
                                <th className="p-3 text-center text-sm font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPurchases.map((bill) => {
                                const displayNumber = getDisplayNumber(bill);
                                const displayDate = getDisplayDate(bill);
                                const resolved = resolveVendorName(bill, clients, displayNumber);
                                const vendorName = resolved.vendorName;
                                const refNumber = getRefNumber(bill);
                                const poNumber = getPoNumber(bill);

                                return (
                                    <tr
                                        key={bill.id}
                                        className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                                        onClick={() => onView(bill)}
                                    >
                                        <td className="p-3">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-mono font-medium">{displayNumber}</span>
                                                {poNumber && (
                                                    <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">
                                                        PO: {poNumber}
                                                    </Badge>
                                                )}
                                                {refNumber && (
                                                    <Badge variant="outline" className="text-xs border-purple-500 text-purple-600">
                                                        Ref: {refNumber}
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm font-medium">{vendorName}</span>
                                            </div>
                                            {resolved.source !== 'client' && (
                                                <span className="text-xs text-yellow-600 ml-6">{resolved.source}</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <span className="text-sm">{formatDate(displayDate)}</span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <Badge variant="secondary">{bill.items.length} items</Badge>
                                        </td>
                                        <td className="p-3 text-right">
                                            <span className="font-medium text-primary">
                                                {formatCurrency(bill.totalAmount)}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <div
                                                className="flex items-center justify-center gap-1"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onView(bill)}
                                                    className="h-8"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => onView(bill)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        {canEdit && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => onEdit(bill)}>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => onDelete(bill)}
                                                                    className="text-red-600"
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </>
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
                {filteredPurchases.map((bill) => {
                    const displayNumber = getDisplayNumber(bill);
                    const displayDate = getDisplayDate(bill);
                    const resolved = resolveVendorName(bill, clients, displayNumber);
                    const vendorName = resolved.vendorName;
                    const poNumber = getPoNumber(bill);

                    return (
                        <Card
                            key={bill.id}
                            className="p-4 space-y-3 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => onView(bill)}
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-mono font-medium">{displayNumber}</span>
                                        {poNumber && (
                                            <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">
                                                PO
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Package className="h-3 w-3" />
                                        {vendorName}
                                    </p>
                                </div>
                                <Badge variant="secondary">{bill.items.length} items</Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Date</p>
                                    <p className="font-medium">{formatDate(displayDate)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-muted-foreground">Amount</p>
                                    <p className="font-bold text-primary">{formatCurrency(bill.totalAmount)}</p>
                                </div>
                            </div>

                            <div
                                className="flex justify-end gap-2 border-t pt-3"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Button size="sm" variant="outline" onClick={() => onView(bill)}>
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                </Button>
                                {canEdit && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onEdit(bill)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => onDelete(bill)}
                                                className="text-red-600"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* No Results */}
            {filteredPurchases.length === 0 && purchases.length > 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    No purchase bills found matching your search criteria.
                </div>
            )}
        </div>
    );
}

export default PurchaseList;
