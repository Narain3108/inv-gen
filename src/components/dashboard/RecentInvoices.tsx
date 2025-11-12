/**
 * Recent Invoices Widget
 * Shows latest invoices
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Invoice, Client } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { FileText } from 'lucide-react';

interface RecentInvoicesProps {
  invoices: Invoice[];
  clients: Client[];
  onViewInvoice?: (invoice: Invoice) => void;
}

export function RecentInvoices({ invoices, clients, onViewInvoice }: RecentInvoicesProps) {
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.clientName || 'Unknown Client';
  };

  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No invoices yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Invoices</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invoices.slice(0, 5).map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => onViewInvoice?.(invoice)}
            >
              <div className="space-y-1">
                <div className="font-medium">{invoice.invoiceNumber}</div>
                <div className="text-sm text-muted-foreground">
                  {getClientName(invoice.clientId)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(invoice.date)}
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="font-semibold">{formatCurrency(invoice.totalAmount)}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default RecentInvoices;
