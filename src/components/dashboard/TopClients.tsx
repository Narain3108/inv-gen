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
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No client data yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {topClients.map((client, index) => (
        <div key={client.clientId} className="flex items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(client.clientName)}
                </AvatarFallback>
              </Avatar>
              {index < 3 && (
                <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
              )}
            </div>
            <div>
              <div className="font-medium">{client.clientName}</div>
              <div className="text-sm text-muted-foreground">
                {client.invoiceCount} {client.invoiceCount === 1 ? 'invoice' : 'invoices'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">{formatCurrency(client.totalRevenue)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TopClients;
