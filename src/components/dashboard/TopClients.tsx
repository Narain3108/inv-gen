/**
 * Top Clients Widget
 * Shows clients with highest revenue
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatCurrency } from '@/utils/formatters';
import { Users } from 'lucide-react';

interface ClientRevenue {
  clientId: string;
  clientName: string;
  totalRevenue: number;
  invoiceCount: number;
}

interface TopClientsProps {
  clients: ClientRevenue[];
}

export function TopClients({ clients }: TopClientsProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (clients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No client data yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Clients</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {clients.slice(0, 5).map((client, index) => (
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
      </CardContent>
    </Card>
  );
}

export default TopClients;
