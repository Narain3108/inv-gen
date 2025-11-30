/**
 * Invoice List Component
 * Display invoices in a table with actions
 */

'use client';

import React, { useState } from 'react';
import { Invoice, Client } from '@/types';
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
import { Download, Edit, Eye, FileText, MoreVertical, Search, Trash2, DollarSign } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';

interface InvoiceListProps {
  invoices: Invoice[];
  clients: Client[];
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
  onView: (invoice: Invoice) => void;
  onDownload: (invoice: Invoice) => void;
  onPayment: (invoice: Invoice) => void;
}

export function InvoiceList({
  invoices,
  clients,
  onEdit,
  onDelete,
  onView,
  onDownload,
  onPayment,
}: InvoiceListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const canEdit = user?.role === 'super_admin' || user?.role === 'admin';

  const getClientName = (clientId: string) => {
    // Safety check: if clients isn't loaded yet, show loading indicator
    if (!clients || clients.length === 0) {
      console.warn('⚠️ getClientName called but clients array is empty or undefined');
      return 'Loading...';
    }
    const client = clients.find(c => c.id === clientId);
    if (!client) {
      console.warn(`⚠️ Client not found for ID: ${clientId}. Available clients:`, clients.map(c => c.id));
    }
    return client?.clientName || 'Unknown Client';
  };

  const getPaymentStatusBadge = (invoice: Invoice) => {
    const status = invoice.paymentStatus || 'pending';
    
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
      paid: { variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
      partially_paid: { variant: 'default', className: 'bg-orange-500 hover:bg-orange-600' },
      pending: { variant: 'destructive', className: '' },
    };

    const config = variants[status] || variants.pending;
    const labels = {
      paid: 'Paid',
      partially_paid: 'Partial',
      pending: 'Pending',
    };

    return (
      <Badge variant={config.variant} className={config.className}>
        {labels[status as keyof typeof labels] || 'Pending'}
      </Badge>
    );
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const clientName = getClientName(invoice.clientId);
    return invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (invoices.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-12">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Invoices Yet</h3>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Create your first invoice to get started.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by invoice number or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="p-3 text-left text-sm font-medium">Invoice #</th>
                <th className="p-3 text-left text-sm font-medium">Client</th>
                <th className="p-3 text-left text-sm font-medium">Date</th>
                <th className="p-3 text-right text-sm font-medium">Amount</th>
                <th className="p-3 text-center text-sm font-medium">Status</th>
                <th className="p-3 text-right text-sm font-medium">Pending</th>
                <th className="p-3 text-center text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => {
                const roundTo2 = (num: number) => Math.round((num || 0) * 100) / 100;
                const amountPending = roundTo2(invoice.amountPending ?? invoice.totalAmount);
                const paymentStatus = (amountPending <= 0.01) ? 'paid' : (invoice.paymentStatus || 'pending');
                
                return (
                  <tr
                    key={invoice.id}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <td className="p-3">
                      <span className="font-mono font-medium">{invoice.invoiceNumber}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">{getClientName(invoice.clientId)}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">
                        {formatDate(invoice.date)}
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium">
                      {formatCurrency(invoice.totalAmount)}
                    </td>
                    <td className="p-3 text-center">
                      {getPaymentStatusBadge(invoice)}
                    </td>
                    <td className="p-3 text-right">
                      {amountPending > 0.01 ? (
                        <span className="font-medium text-orange-600">
                          {formatCurrency(amountPending)}
                        </span>
                      ) : (
                        <span className="text-sm text-green-600">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant={paymentStatus === 'paid' ? 'ghost' : 'outline'}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPayment(invoice);
                          }}
                          className="h-8"
                        >
                          <DollarSign className="h-3.5 w-3.5 mr-1" />
                          {paymentStatus === 'paid' ? 'History' : 'Payment'}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onView(invoice)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDownload(invoice)}>
                              <Download className="mr-2 h-4 w-4" />
                              Download PDF
                            </DropdownMenuItem>
                            {canEdit && (
                              <>
                                <DropdownMenuItem onClick={() => onEdit(invoice)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onDelete(invoice)}
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

      {/* No Results */}
      {filteredInvoices.length === 0 && invoices.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No invoices found matching your search criteria.
        </div>
      )}
    </div>
  );
}

export default InvoiceList;
