'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatClientDropdownLabel } from '@/utils/formatters';
import { ClientForm } from '@/components/clients/ClientForm';
import { clientsApi } from '@/lib/api/clients.api';
import { toast } from 'sonner';
import { z } from 'zod';
import { clientFormSchema } from '@/lib/validations';
import { useAppData } from '@/contexts/AppDataContext';

type ClientFormData = z.infer<typeof clientFormSchema>;

interface SearchableClientDropdownProps {
  clients: Client[];
  selectedClientId?: string;
  onClientSelect: (clientId: string) => void;
  onClientAdded?: (client: Client) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  companyId: string;
  className?: string;
}

export function SearchableClientDropdown({
  clients,
  selectedClientId,
  onClientSelect,
  onClientAdded,
  placeholder = " ", // Default to empty space for floating label triggers
  label = "Client",
  required = false,
  error,
  companyId,
  className
}: SearchableClientDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { refreshClients } = useAppData();

  const selectedClient = clients.find(c => c.id === selectedClientId);

  // Filter clients based on search term
  const filteredClients = clients.filter(client =>
    client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.gstin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev < filteredClients.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < filteredClients.length) {
            handleClientSelect(filteredClients[highlightedIndex]);
          } else if (filteredClients.length === 0 && searchTerm.trim()) {
            setIsAddClientOpen(true);
            setIsOpen(false);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSearchTerm('');
          setHighlightedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, filteredClients, searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClientSelect = (client: Client) => {
    onClientSelect(client.id);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleAddClient = async (data: ClientFormData) => {
    try {
      const newClient = await clientsApi.create({
        clientName: data.clientName,
        gstin: data.gstin || undefined,
        pan: data.pan || undefined,
        address: data.address,
        contact: {
          phone: data.contact.phone || '',
          email: data.contact.email || '',
          website: data.contact.website || undefined,
        },
        companyId,
        billingAddress: data.address,
        shippingAddress: data.address,
        bankDetails: data.bankDetails &&
          data.bankDetails.bankName &&
          data.bankDetails.accountNumber &&
          data.bankDetails.ifscCode &&
          data.bankDetails.accountHolderName ? {
          accountNumber: data.bankDetails.accountNumber,
          ifscCode: data.bankDetails.ifscCode,
          bankName: data.bankDetails.bankName,
          accountHolderName: data.bankDetails.accountHolderName,
          branch: data.bankDetails.branch || undefined,
          upiId: data.bankDetails.upiId || undefined,
        } : undefined,
      });

      toast.success('Client added successfully');
      await refreshClients();
      onClientAdded?.(newClient);
      onClientSelect(newClient.id);
      setIsAddClientOpen(false);
      setSearchTerm('');
    } catch (error) {
      console.error('Failed to add client:', error);
      toast.error('Failed to add client');
    }
  };

  const displayValue = selectedClient
    ? formatClientDropdownLabel(selectedClient, { maxLength: 40 })
    : '';

  const isFloating = isOpen || searchTerm || displayValue;

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div className="relative">
        <div
          className={cn(
            "group relative flex w-full rounded-md border-2 border-foreground/40 bg-transparent text-xs ring-offset-background cursor-pointer transition-colors duration-200",
            "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
            error && "border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
            // Padding strategy to match FloatingLabelInput (pt-3 pb-1.5 px-2.5)
            "pt-3 pb-1.5 px-2.5"
          )}
          onClick={() => {
            setIsOpen(!isOpen);
            inputRef.current?.focus();
          }}
        >
          <input
            ref={inputRef}
            id="client-search"
            value={isOpen ? searchTerm : displayValue}
            onChange={(e) => {
              const v = e.target.value;
              setSearchTerm(v);
              setHighlightedIndex(-1);
              // Only open dropdown when user types a non-empty value
              if (v && v.trim() !== '') setIsOpen(true);
            }}
            onFocus={() => {
              // don't auto open
            }}
            placeholder=" "
            className="peer block w-full appearance-none bg-transparent p-0 text-xs focus:outline-none focus:ring-0 placeholder-transparent"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />

          <ChevronDown className={cn(
            "h-4 w-4 opacity-50 transition-transform absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none",
            isOpen && "rotate-180"
          )} />

          <label
            className={cn(
              "absolute left-2.5 top-1/2 -translate-y-1/2 origin-[0] select-none bg-transparent px-0.5 text-xs text-muted-foreground pointer-events-none transition-all duration-200 ease-out",
              // Float when open, has search term, or has value (displayValue)
              (isOpen || searchTerm || displayValue) && "top-0 -translate-y-1/2 scale-[0.85] px-1 text-primary bg-background",
              // Also trigger on peer-focus via CSS if needed
              "peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-[0.85] peer-focus:px-1 peer-focus:text-primary peer-focus:bg-background",
              "peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:scale-[0.85] peer-[:not(:placeholder-shown)]:px-1 peer-[:not(:placeholder-shown)]:bg-background",
              error && "text-destructive peer-focus:text-destructive"
            )}
          >
            {label} {required && <span>*</span>}
          </label>
        </div>

        {isOpen && (
          <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-auto shadow-lg">
            <CardContent className="p-0">
              {filteredClients.length > 0 ? (
                <div className="py-1">
                  {filteredClients.map((client, index) => (
                    <div
                      key={client.id}
                      className={cn(
                        "px-3 py-2 cursor-pointer text-sm hover:bg-accent hover:text-accent-foreground",
                        index === highlightedIndex && "bg-accent text-accent-foreground",
                        selectedClientId === client.id && "bg-primary/10"
                      )}
                      onClick={() => handleClientSelect(client)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">
                          {formatClientDropdownLabel(client, { maxLength: 50 })}
                        </span>
                        {selectedClientId === client.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  No clients found
                </div>
              )}

              {/* Add Client Button */}
              <div className="border-t p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAddClientOpen(true);
                    setIsOpen(false);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Client
                  {searchTerm.trim() && ` "${searchTerm.trim()}"`}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}

      {/* Add Client Dialog */}
      <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Create a new client to add to your database.
            </DialogDescription>
          </DialogHeader>
          <ClientForm
            companyId={companyId}
            onSubmit={handleAddClient}
            onCancel={() => setIsAddClientOpen(false)}
            client={searchTerm.trim() ? {
              clientName: searchTerm.trim(),
              address: { street: '', city: '', state: '', pincode: '', country: 'India' },
              contact: { phone: '', email: '' }
            } as any : undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}