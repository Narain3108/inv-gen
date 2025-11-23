/**
 * Top Clients Widget
 * Shows clients with highest revenue
 */

'use client';

import React, { useMemo } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatCurrency } from '@/utils/formatters';
import { Users } from 'lucide-react';
import { Invoice, Client } from '@/types';

interface TopClientsProps {
  invoices: Invoice[];
  clients: Client[];
}

export function TopClients({ invoices, clients }: TopClientsProps) {
  const topClients = useMemo(() => {
    const clientRevenue: Record<string, { name: string; total: number; count: number }> = {};

    invoices.forEach((invoice) => {
      if (!clientRevenue[invoice.clientId]) {
        const client = clients.find(c => c.id === invoice.clientId);
        clientRevenue[invoice.clientId] = {
          name: client?.clientName || 'Unknown Client',
          total: 0,
          count: 0,
        };
      }
      clientRevenue[invoice.clientId].total += invoice.totalAmount || 0;
      clientRevenue[invoice.clientId].count += 1;
    });

    return Object.entries(clientRevenue)
      .map(([id, data]) => ({
        clientId: id,
        clientName: data.name,
        totalRevenue: data.total,
        invoiceCount: data.count,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);
  }, [invoices, clients]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (topClients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
        <div className="p-3 sm:p-4 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 mb-3">
          <Users className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">No client data yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {topClients.map((client, index) => (
        <div 
          key={client.clientId} 
          className="flex items-center gap-3 sm:gap-4 p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-muted/30 to-transparent dark:from-muted/20 hover:from-muted/50 dark:hover:from-muted/30 border border-transparent hover:border-primary/20 dark:hover:border-primary/30 transition-all duration-300 group"
        >
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="relative shrink-0">
              <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border-2 border-background dark:border-primary/20 group-hover:border-primary/30 dark:group-hover:border-primary/40 transition-colors">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 dark:from-primary/30 dark:to-accent/30 text-primary text-xs sm:text-sm font-bold">
                  {getInitials(client.clientName)}
                </AvatarFallback>
              </Avatar>
              {index < 3 && (
                <div className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-primary to-accent text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg shadow-primary/30 dark:shadow-primary/20 group-hover:scale-110 transition-transform">
                  {index + 1}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm sm:text-base truncate text-foreground group-hover:text-primary transition-colors">
                {client.clientName}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                {client.invoiceCount} {client.invoiceCount === 1 ? 'invoice' : 'invoices'}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-bold text-sm sm:text-base text-foreground tabular-nums">
              {formatCurrency(client.totalRevenue)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TopClients;
