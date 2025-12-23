'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { productsApi } from '@/lib/api/products.api';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  productId?: string; // optional — when provided and fetchFromDb=true will fetch available serials
  initialSelected?: string[]; // pre-selected serials
  quantity?: number; // required count
  fetchFromDb?: boolean; // whether to fetch available serials
  claimFromDb?: boolean; // whether to remove used serials from product pool on save
  onSave: (selected: string[]) => Promise<void> | void; // called with final selected list
}

export default function SerialManager({ open, onClose, productId, initialSelected = [], quantity = 0, fetchFromDb = false, claimFromDb = false, onSave }: Props) {
  const [available, setAvailable] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>(initialSelected || []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(initialSelected || []);
    }
  }, [open, initialSelected]);

  useEffect(() => {
    if (!open) return;
    if (fetchFromDb && productId) {
      (async () => {
        try {
          setLoading(true);
          const prod = await productsApi.getById(productId);
          setAvailable(prod.serialNumbers || []);
        } catch (err) {
          console.error('Failed to fetch product serials', err);
          toast.error('Failed to load available serials');
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setAvailable([]);
    }
  }, [open, fetchFromDb, productId]);

  const useAvailable = (s: string) => {
    if (selected.includes(s)) return;
    setSelected(prev => [...prev, s]);
    setAvailable(prev => prev.filter(x => x !== s));
  };

  const addManual = () => {
    const s = (input || '').trim();
    if (!s) return;
    if (selected.includes(s)) {
      toast.warning('Serial number already added');
      setInput('');
      return;
    }
    if (quantity > 0 && selected.length >= quantity) {
      toast.warning(`Maximum ${quantity} serial numbers allowed`);
      setInput('');
      return;
    }
    setSelected(prev => [...prev, s]);
    setInput('');
  };

  const removeSelected = (s: string) => setSelected(prev => prev.filter(x => x !== s));

  const handleSave = async () => {
    if (quantity > 0 && selected.length !== quantity) {
      toast.error(`Please add exactly ${quantity} serial number(s). Currently have ${selected.length}.`);
      return;
    }

    // Check for empty serial numbers
    if (selected.some(s => !s.trim())) {
      toast.error('Serial numbers cannot be empty');
      return;
    }

    // Check for duplicate serial numbers
    const duplicates = selected.filter((s, i) => selected.indexOf(s) !== i);
    if (duplicates.length > 0) {
      toast.error(`Duplicate serial numbers found: ${duplicates.join(', ')}`);
      return;
    }

    try {
      if (claimFromDb && fetchFromDb && productId) {
        // remove any used ones that were from the available pool
        const prod = await productsApi.getById(productId);
        const pool = prod.serialNumbers || [];
        const usedFromPool = selected.filter(s => pool.includes(s));
        if (usedFromPool.length > 0) {
          const remaining = pool.filter(s => !usedFromPool.includes(s));
          await productsApi.update(productId, { serialNumbers: remaining });
        }
      }

      await onSave(selected);
      toast.success(`${selected.length} serial number(s) saved successfully`);
    } catch (err) {
      console.error('Failed to save serials', err);
      toast.error('Failed to save serials');
    } finally {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { 
      if (!o) {
        // Reset state when closing without saving
        setSelected(initialSelected || []);
        setInput('');
        onClose();
      }
    }}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Serial Numbers</DialogTitle>
          <DialogDescription>
            {quantity > 0 ? `Add exactly ${quantity} serial number(s) for this product.` : 'Add serial numbers for this product.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          <div>
            <Label className="text-sm font-medium">Add Serial Number</Label>
            <div className="flex gap-2 mt-2">
              <Input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Enter serial number" 
                onKeyPress={(e) => e.key === 'Enter' && addManual()}
                className="flex-1"
              />
              <Button type="button" onClick={addManual} disabled={!input.trim()}>
                Add
              </Button>
            </div>
            {quantity > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {selected.length} of {quantity} serial numbers added
              </p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium">Selected Serial Numbers</Label>
            {selected.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No serials selected</p>
            ) : (
              <div className="space-y-1 mt-2 max-h-40 overflow-y-auto border rounded p-2 bg-blue-50">
                {selected.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 py-1">
                    <div className="font-mono text-sm truncate flex-1">{s}</div>
                    <Button size="sm" type="button" variant="ghost" onClick={() => removeSelected(s)} className="text-xs px-2 py-1 h-6 text-red-600 hover:text-red-800">
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSave} 
            disabled={quantity > 0 && selected.length !== quantity}
            className="flex-1"
          >
            Save ({selected.length})
          </Button>
        </DialogFooter>
        <DialogClose />
      </DialogContent>
    </Dialog>
  );
}
