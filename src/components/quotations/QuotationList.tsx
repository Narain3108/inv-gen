/**
 * Quotation List Component
 * Display quotations with status badges and convert-to-invoice action
 */

'use client';

import React, { useState } from 'react';
import { Quotation, Client, QuotationStatus } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, Edit, Eye, FileText, MoreVertical, Search, Trash2, ArrowRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface QuotationListProps {
  quotations: Quotation[];
  clients: Client[];
  onEdit: (quotation: Quotation) => void;
  onDelete: (quotation: Quotation) => void;
  onView: (quotation: Quotation) => void;
  onDownload: (quotation: Quotation) => void;
  onConvertToInvoice: (quotation: Quotation) => void;
  onUpdateStatus: (quotation: Quotation, status: QuotationStatus) => void;
}

export function QuotationList({
  quotations,
  clients,
  onEdit,
  onDelete,
  onView,
  onDownload,
  onConvertToInvoice,
  onUpdateStatus,
}: QuotationListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.clientName || 'Unknown Client';
  };

  const getStatusBadge = (status: QuotationStatus, validUntil?: Date) => {
    // Check if quotation is expired
    const isExpired = validUntil && new Date(validUntil) < new Date() && status === 'pending';

    if (isExpired) {
      return (
        <Badge variant="secondary" className="bg-gray-500 text-white">
          <Clock className="mr-1 h-3 w-3" />
          Expired
        </Badge>
      );
    }

    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-500 text-white">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case 'accepted':
        return (
          <Badge variant="secondary" className="bg-green-500 text-white">
            <CheckCircle className="mr-1 h-3 w-3" />
            Accepted
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="secondary" className="bg-red-500 text-white">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      case 'converted':
        return (
          <Badge variant="secondary" className="bg-blue-500 text-white">
            <ArrowRight className="mr-1 h-3 w-3" />
            Converted
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="secondary" className="bg-gray-500 text-white">
            <Clock className="mr-1 h-3 w-3" />
            Expired
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredQuotations = quotations.filter((quotation) => {
    const clientName = getClientName(quotation.clientId);
    return quotation.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (quotations.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-12">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Quotations Yet</h3>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Create your first quotation to provide estimates to clients.
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
            placeholder="Search by quotation number or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Quotations Table - Desktop */}
      <Card className="overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="p-3 text-left text-sm font-medium">Quotation #</th>
                <th className="p-3 text-left text-sm font-medium">Client</th>
                <th className="p-3 text-left text-sm font-medium">Date</th>
                <th className="p-3 text-left text-sm font-medium">Valid Until</th>
                <th className="p-3 text-right text-sm font-medium">Amount</th>
                <th className="p-3 text-center text-sm font-medium">Status</th>
                <th className="p-3 text-center text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotations.map((quotation) => {
                // Handle validUntil which can be a string (API) or Date/Timestamp
                let validUntilDate: Date | null = null;
                if (quotation.validUntil) {
                  if (typeof quotation.validUntil === 'string') {
                    validUntilDate = new Date(quotation.validUntil);
                  } else if (quotation.validUntil instanceof Date) {
                    validUntilDate = quotation.validUntil;
                  } else if ((quotation.validUntil as any).toDate) {
                    validUntilDate = (quotation.validUntil as any).toDate();
                  }
                }

                const isExpired = validUntilDate && validUntilDate < new Date() && quotation.status === 'pending';
                const canConvert = quotation.status !== 'converted' && quotation.status !== 'rejected' && !isExpired;

                return (
                  <tr
                    key={quotation.id}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => onView(quotation)}
                  >
                    <td className="p-3">
                      <span className="font-mono font-medium">{quotation.quotationNumber}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">{getClientName(quotation.clientId)}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">
                        {formatDate(quotation.date)}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-sm ${isExpired ? 'text-red-500 font-semibold' : ''}`}>
                        {validUntilDate ? formatDate(validUntilDate) : 'N/A'}
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium">
                      {formatCurrency(quotation.totalAmount)}
                    </td>
                    <td className="p-3 text-center">
                      {getStatusBadge(isExpired ? 'expired' : quotation.status, validUntilDate || undefined)}
                    </td>
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView(quotation)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDownload(quotation)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                          {canConvert && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => onConvertToInvoice(quotation)}
                                className="text-blue-600 font-medium"
                              >
                                <ArrowRight className="mr-2 h-4 w-4" />
                                Convert to Invoice
                              </DropdownMenuItem>
                            </>
                          )}
                          {quotation.status === 'pending' && !isExpired && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onUpdateStatus(quotation, 'accepted')}>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                Mark as Accepted
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onUpdateStatus(quotation, 'rejected')}>
                                <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                Mark as Rejected
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onEdit(quotation)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(quotation)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quotations Cards - Mobile */}
      <div className="space-y-3 md:hidden">
        {filteredQuotations.map((quotation) => {
          const validUntilDate = quotation.validUntil ? (typeof quotation.validUntil === 'string' ? new Date(quotation.validUntil) : quotation.validUntil) : null;
          const isExpired = validUntilDate && !isNaN(validUntilDate.getTime()) && validUntilDate < new Date() && quotation.status === 'pending';
          const canConvert = quotation.status !== 'converted' && quotation.status !== 'rejected' && !isExpired;

          return (
            <Card key={quotation.id} className="p-4 space-y-3 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="font-mono font-medium text-sm">{quotation.quotationNumber}</span>
                  <p className="text-sm text-muted-foreground">{getClientName(quotation.clientId)}</p>
                </div>
                {getStatusBadge(isExpired ? 'expired' : quotation.status, validUntilDate || undefined)}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {formatDate(quotation.date)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valid Until</p>
                  <p className={`font-medium ${isExpired ? 'text-red-500' : ''}`}>
                    {validUntilDate ? formatDate(validUntilDate) : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center border-t pt-3">
                <div>
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(quotation.totalAmount)}</p>
                </div>
                <div className="flex gap-2">
                  {canConvert && (
                    <Button
                      size="sm"
                      onClick={() => onConvertToInvoice(quotation)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <ArrowRight className="mr-1 h-3 w-3" />
                      Convert
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(quotation)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDownload(quotation)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </DropdownMenuItem>
                      {quotation.status === 'pending' && !isExpired && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onUpdateStatus(quotation, 'accepted')}>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                            Accept
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdateStatus(quotation, 'rejected')}>
                            <XCircle className="mr-2 h-4 w-4 text-red-600" />
                            Reject
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit(quotation)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(quotation)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* No Results */}
      {filteredQuotations.length === 0 && quotations.length > 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No quotations found matching your search.</p>
        </Card>
      )}
    </div>
  );
}

export default QuotationList;
