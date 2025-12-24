'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { productsApi } from '@/lib/api/products.api';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface SerialWithStatus {
  serial: string;
  status?: 'used' | 'unused';
  invoiceId?: string;
  purchaseId?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  productId?: string; // optional — when provided and fetchFromDb=true will fetch available serials
  initialSelected?: string[]; // pre-selected serials
  quantity?: number; // required count
  fetchFromDb?: boolean; // whether to fetch available serials with status
  claimFromDb?: boolean; // deprecated - backend now handles serial claiming
  onSave: (selected: string[]) => Promise<void> | void; // called with final selected list
}

export default function SerialManager({ open, onClose, productId, initialSelected = [], quantity = 0, fetchFromDb = false, claimFromDb = false, onSave }: Props) {
  const [available, setAvailable] = useState<SerialWithStatus[]>([]);
  const [selected, setSelected] = useState<string[]>(initialSelected || []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSelected(initialSelected || []);
  }, [initialSelected]);

  useEffect(() => {
    if (!open) return;
    if (fetchFromDb && productId) {
      (async () => {
        try {
          setLoading(true);
          // Fetch serials with status from backend endpoint
          const data = await productsApi.getSerials(productId, 'unused');
          const serialsData = data.serials || {};
          
          // Convert object to array with status metadata
          const serialsList: SerialWithStatus[] = Object.entries(serialsData).map(([serial, metadata]: [string, any]) => ({
            serial,
            status: metadata.status || 'unused',
            invoiceId: metadata.invoiceId,
            purchaseId: metadata.purchaseId,
          }));
          
          setAvailable(serialsList);
        } catch (err) {
          console.error('Failed to fetch product serials', err);
          toast.error('Failed to load available serials');
          setAvailable([]);
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setAvailable([]);
    }
  }, [open, fetchFromDb, productId]);

  const useAvailable = (serialObj: SerialWithStatus) => {
    if (selected.includes(serialObj.serial)) return;
    setSelected(prev => [...prev, serialObj.serial]);
    setAvailable(prev => prev.filter(x => x.serial !== serialObj.serial));
  };

  const addManual = () => {
    const s = (input || '').trim();
    if (!s) return;
    if (selected.includes(s)) {
      toast.warning('Already added');
      setInput('');
      return;
    }
    setSelected(prev => [...prev, s]);
    setInput('');
  };

  const removeSelected = (s: string) => setSelected(prev => prev.filter(x => x !== s));

  const handleSave = async () => {
    if (quantity > 0 && selected.length !== quantity) {
      toast.error(`Please add ${quantity} serial number(s)`);
      return;
    }

    try {
      // Backend now handles serial claiming transactionally, no need for client-side updates
      await onSave(selected);
    } catch (err) {
      console.error('Failed to save serials', err);
      toast.error('Failed to save serials');
    } finally {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Serial Numbers</DialogTitle>
          <DialogDescription>Add serials manually or pick available ones.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[56vh] overflow-y-auto">
          {fetchFromDb && (
            <div>
              <Label className="text-sm font-medium">Available (Unused)</Label>
              {loading ? (
                <p className="text-xs text-muted-foreground">Loading…</p>
              ) : available.length === 0 ? (
                <p className="text-xs text-muted-foreground">No available serials</p>
              ) : (
                <div className="space-y-1 mt-2">
                  {available.map(serialObj => (
                    <div key={serialObj.serial} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm truncate">{serialObj.serial}</span>
                        <Badge variant="secondary" className="text-xs">
                          {serialObj.status === 'unused' ? '✓ Available' : 'Used'}
                        </Badge>
                      </div>
                      <Button size="sm" type="button" variant="ghost" onClick={() => useAvailable(serialObj)}>Use</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <Label className="text-sm font-medium">Add Manual Serial</Label>
            <div className="flex gap-2 mt-2">
              <Input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && addManual()}
                placeholder="Enter serial" 
              />
              <Button type="button" onClick={addManual}>Add</Button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Selected ({selected.length}{quantity > 0 ? `/${quantity}` : ''})</Label>
            {selected.length === 0 && <p className="text-xs text-muted-foreground">No serials selected</p>}
            <div className="space-y-1 mt-2">
              {selected.map(s => (
                <div key={s} className="flex items-center justify-between gap-3">
                  <div className="font-mono text-sm truncate">{s}</div>
                  <Button size="sm" type="button" variant="ghost" onClick={() => removeSelected(s)}>Remove</Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={handleSave}>Save</Button>
          </div>
        </DialogFooter>
        <DialogClose />
      </DialogContent>
    </Dialog>
  );
}
