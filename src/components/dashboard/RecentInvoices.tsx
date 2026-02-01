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
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
            <div className="p-3 sm:p-4 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 mb-3">
              <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">No invoices yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg">Recent Invoices</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="space-y-2 sm:space-y-3">
          {invoices.slice(0, 5).map((invoice) => (
            <div
              key={invoice.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl border bg-gradient-to-r from-muted/30 to-transparent dark:from-muted/20 hover:from-muted/50 dark:hover:from-muted/30 cursor-pointer transition-all duration-300 group hover-lift"
              onClick={() => onViewInvoice?.(invoice)}
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors truncate">
                  {invoice.invoiceNumber}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground truncate">
                  {getClientName(invoice.clientId)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(invoice.date)}
                </div>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-1 shrink-0">
                <div className="font-bold text-sm sm:text-base text-foreground tabular-nums">
                  {formatCurrency(invoice.totalAmount)}
                </div>
                <Badge
                  variant={invoice.paymentStatus === 'paid' ? 'default' : invoice.paymentStatus === 'partially_paid' ? 'secondary' : 'outline'}
                  className="text-xs"
                >
                  {invoice.paymentStatus === 'paid' ? 'Paid' : invoice.paymentStatus === 'partially_paid' ? 'Partial' : 'Pending'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default RecentInvoices;
