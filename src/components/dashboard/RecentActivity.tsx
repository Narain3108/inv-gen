/**
 * Recent Activity Component
 * Display recent invoices and quotations activity
 */
'use client';
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { FileText, FileCheck, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Invoice, Quotation, Client } from '@/types';

interface RecentActivityProps {
  invoices: Invoice[];
  quotations: Quotation[];
  clients: Client[];
}

export function RecentActivity({ invoices, quotations, clients }: RecentActivityProps) {
  const activities = useMemo(() => {
    // Helper function to safely convert any date format to Date
    const toDate = (timestamp: any): Date => {
      if (!timestamp) return new Date();

      // Handle Date instance
      if (timestamp instanceof Date) return timestamp;

      // Handle ISO string
      if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? new Date() : date;
      }

      // Handle Firestore Timestamp object with _seconds
      if (typeof timestamp === 'object' && timestamp._seconds) {
        return new Date(timestamp._seconds * 1000);
      }

      // Handle Firestore Timestamp with toDate method
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
      }

      // Fallback: try to parse as date
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? new Date() : date;
    };

    // Get last 5 invoices
    const invActivities = invoices
      .slice(0, 5)
      .map((inv) => ({
        id: inv.id,
        type: 'invoice' as const,
        title: `Invoice ${inv.invoiceNumber}`,
        clientName: clients.find(c => c.id === inv.clientId)?.clientName || 'Unknown',
        amount: inv.totalAmount,
        date: toDate(inv.date),
        status: inv.paymentStatus,
      }));

    // Get last 5 quotations
    const quotActivities = quotations
      .slice(0, 5)
      .map((quot) => ({
        id: quot.id,
        type: 'quotation' as const,
        title: `Quotation ${quot.quotationNumber}`,
        clientName: clients.find(c => c.id === quot.clientId)?.clientName || 'Unknown',
        amount: quot.totalAmount,
        date: toDate(quot.date),
        status: quot.status,
      }));

    // Combine and sort by date, then take top 10 most recent
    return [...invActivities, ...quotActivities]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);
  }, [invoices, quotations, clients]);

  const getStatusIcon = (type: string, status: string) => {
    if (type === 'invoice') {
      if (status === 'paid') return <CheckCircle className="h-4 w-4 text-green-500" />;
      if (status === 'partially_paid') return <Clock className="h-4 w-4 text-yellow-500" />;
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
    return <FileCheck className="h-4 w-4 text-blue-500" />;
  };

  const getStatusBadge = (type: string, status: string) => {
    if (type === 'invoice') {
      if (status === 'paid') return <Badge className="bg-green-500">Paid</Badge>;
      if (status === 'partially_paid') return <Badge className="bg-yellow-500">Partial</Badge>;
      return <Badge className="bg-orange-500">Pending</Badge>;
    }
    if (status === 'accepted') return <Badge className="bg-green-500">Accepted</Badge>;
    if (status === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  return (
    <Card className="border-2 border-black dark:border-white">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                  {getStatusIcon(activity.type, activity.status)}
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    {getStatusBadge(activity.type, activity.status)}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {activity.clientName}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-muted-foreground">
                      {formatDate(activity.date)}
                    </p>
                    <p className="text-sm font-medium">
                      {formatCurrency(activity.amount)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
