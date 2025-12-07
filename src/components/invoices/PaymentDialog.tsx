/**
 * Payment Dialog Component
 * Record payment for an invoice
 */

'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PaymentMode, Invoice } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { DollarSign, Calendar, CreditCard, FileText, Clock, Hash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'react-hot-toast';

const paymentFormSchema = z.object({
  amount: z.number()
    .min(0.01, 'Amount must be greater than 0')
    .max(999999999, 'Amount is too large'),
  paymentDate: z.string(),
  paymentMode: z.enum(['cash', 'upi', 'bank_transfer', 'cheque', 'credit_card', 'debit_card', 'net_banking']).optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onSubmit: (data: PaymentFormData) => Promise<void>;
}

const paymentModes: { value: PaymentMode; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'net_banking', label: 'Net Banking' },
];

export function PaymentDialog({
  open,
  onOpenChange,
  invoice,
  onSubmit,
}: PaymentDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: invoice?.amountPending || 0,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: 'cash',
      referenceNumber: '',
      notes: '',
    },
  });

  const selectedPaymentMode = watch('paymentMode');
  const enteredAmount = watch('amount');

  React.useEffect(() => {
    if (invoice && open) {
      const roundTo2 = (num: number) => Math.round((num || 0) * 100) / 100;
      setValue('amount', roundTo2(invoice.amountPending ?? invoice.totalAmount));
      setValue('paymentDate', new Date().toISOString().split('T')[0]);
      setValue('paymentMode', 'cash');
      setValue('referenceNumber', '');
      setValue('notes', '');
    }
  }, [invoice, open, setValue]);

  const handleFormSubmit = async (data: PaymentFormData) => {
    // Prevent submitting an amount greater than the pending balance
    const roundTo2 = (num: number) => Math.round((num || 0) * 100) / 100;
    const pending = roundTo2(invoice?.amountPending ?? invoice?.totalAmount ?? 0);
    const entered = roundTo2(data.amount || 0);
    if (entered > pending + 0.001) {
      const msg = `Amount exceeds pending balance (${formatCurrency(pending)})`;
      setError('amount', { type: 'manual', message: msg });
      toast.error(msg);
      return;
    }

    await onSubmit(data);
    reset();
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  if (!invoice) return null;

  // Round to 2 decimals to avoid floating point issues
  const roundTo2 = (num: number) => Math.round((num || 0) * 100) / 100;
  
  const totalAmount = roundTo2(invoice.totalAmount);
  const amountPaid = roundTo2(invoice.amountPaid || 0);
  const amountPending = roundTo2(invoice.amountPending ?? totalAmount);
  const maxAmount = amountPending;
  const paymentHistory = invoice.payments || [];
  const hasPayments = paymentHistory.length > 0;
  const isPaid = (invoice.paymentStatus === 'paid' || amountPending <= 0.01);

  const getPaymentModeLabel = (mode?: PaymentMode) => {
    if (!mode) return 'N/A';
    const modeMap: Record<PaymentMode, string> = {
      cash: 'Cash',
      upi: 'UPI',
      bank_transfer: 'Bank Transfer',
      cheque: 'Cheque',
      credit_card: 'Credit Card',
      debit_card: 'Debit Card',
      net_banking: 'Net Banking',
    };
    return modeMap[mode] || mode;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{isPaid ? 'Payment History' : 'Record Payment'}</DialogTitle>
          <DialogDescription>
            {isPaid 
              ? `Complete payment details for invoice ${invoice.invoiceNumber}`
              : `Record a payment for invoice ${invoice.invoiceNumber}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <form id="payment-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 pt-4">
            {/* Invoice Summary */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-medium">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="font-medium text-green-600">{formatCurrency(amountPaid)}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="font-medium">Amount Pending:</span>
                <span className="font-bold text-orange-600">{formatCurrency(amountPending)}</span>
              </div>
            </div>

            {/* Payment History Section */}
            {hasPayments && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm">Payment History ({paymentHistory.length})</h3>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {paymentHistory.map((payment, index) => (
                    <div
                      key={payment.id}
                      className="rounded-lg border bg-card p-3 space-y-2 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Payment #{paymentHistory.length - index}
                            </Badge>
                            <span className="font-semibold text-green-600">
                              {formatCurrency(payment.amount)}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {payment.paymentDate
                                  ? formatDate(
                                      typeof payment.paymentDate === 'string'
                                        ? new Date(payment.paymentDate)
                                        : payment.paymentDate
                                    )
                                  : 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              <span>{getPaymentModeLabel(payment.paymentMode)}</span>
                            </div>
                          </div>
                          {payment.referenceNumber && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Hash className="h-3 w-3" />
                              <span className="font-mono">{payment.referenceNumber}</span>
                            </div>
                          )}
                          {payment.notes && (
                            <div className="text-xs text-muted-foreground mt-1 pl-4 border-l-2 border-muted">
                              {payment.notes}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground text-right">
                          {payment.recordedAt
                            ? formatDate(
                                typeof payment.recordedAt === 'string'
                                  ? new Date(payment.recordedAt)
                                  : payment.recordedAt
                              )
                            : 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Divider if there's payment history */}
            {hasPayments && !isPaid && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-sm mb-4">Record New Payment</h3>
              </div>
            )}

            {/* Show form only if not fully paid */}
            {!isPaid && (
              <>
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Payment Amount *
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="Enter payment amount"
                {...register('amount', { valueAsNumber: true })}
                className={errors.amount ? 'border-red-500' : ''}
              />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
              {roundTo2(enteredAmount) > roundTo2(maxAmount) + 0.01 && (
                <p className="text-sm text-orange-600">
                  ⚠️ Amount exceeds pending balance ({formatCurrency(maxAmount)})
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setValue('amount', maxAmount)}
                >
                  Full Amount
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setValue('amount', maxAmount / 2)}
                >
                  Half Amount
                </Button>
              </div>
            </div>          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="paymentDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Payment Date *
            </Label>
            <Input
              id="paymentDate"
              type="date"
              {...register('paymentDate')}
              className={errors.paymentDate ? 'border-red-500' : ''}
            />
            {errors.paymentDate && (
              <p className="text-sm text-red-500">{errors.paymentDate.message}</p>
            )}
          </div>

          {/* Payment Mode */}
          <div className="space-y-2">
            <Label htmlFor="paymentMode" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Mode
            </Label>
            <Select
              value={selectedPaymentMode}
              onValueChange={(value) => setValue('paymentMode', value as PaymentMode)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                {paymentModes.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reference Number */}
          <div className="space-y-2">
            <Label htmlFor="referenceNumber" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reference Number / Transaction ID
            </Label>
            <Input
              id="referenceNumber"
              placeholder="e.g., CHQ123456, UPI/123456789"
              {...register('referenceNumber')}
            />
            <p className="text-xs text-muted-foreground">
              Optional: Enter cheque number, transaction ID, or reference
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes about this payment..."
              rows={3}
              {...register('notes')}
            />
          </div>
          </>
            )}
          </form>
        </div>

        {!isPaid && (
        <DialogFooter className="px-6 pb-6 pt-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" form="payment-form" disabled={isSubmitting}>
            {isSubmitting ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogFooter>
        )}
        
        {isPaid && (
        <DialogFooter className="px-6 pb-6 pt-0">
          <Button
            type="button"
            onClick={handleClose}
          >
            Close
          </Button>
        </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PaymentDialog;
