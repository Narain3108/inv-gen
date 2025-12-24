import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Product {
  id: string;
  name: string;
  stock?: number;
  [key: string]: any;
}

interface OutOfStockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  availableStock: number;
  requestedQuantity: number;
  onProceedAnyway: () => void;
  isInvoice?: boolean;
}

export const OutOfStockDialog: React.FC<OutOfStockDialogProps> = ({
  isOpen,
  onClose,
  product,
  availableStock,
  requestedQuantity,
  onProceedAnyway,
  isInvoice = false,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Insufficient Stock
          </DialogTitle>
          <DialogDescription>
            The requested quantity exceeds available stock.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Product:</span>
              <span className="text-muted-foreground">{product.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium">Available Stock:</span>
              <span className="text-green-600 font-semibold">{availableStock}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium">Requested Quantity:</span>
              <span className="text-red-600 font-semibold">{requestedQuantity}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="font-medium">Short by:</span>
              <span className="text-red-600 font-bold">
                {requestedQuantity - availableStock} units
              </span>
            </div>
          </div>

          <Alert variant="destructive" className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              {isInvoice ? (
                <>
                  Proceeding with insufficient stock may cause fulfillment issues.
                  Consider updating stock levels first or adjust the quantity.
                </>
              ) : (
                <>
                  You can still proceed with this quotation, but please ensure
                  stock availability before converting to an invoice.
                </>
              )}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={() => {
              onProceedAnyway();
              onClose();
            }}
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700"
          >
            Proceed Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
