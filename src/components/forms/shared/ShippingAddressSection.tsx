/**
 * ShippingAddressSection Component
 * Opt-in shipping address selection for invoices
 */

'use client';

import React, { useState } from 'react';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';
import { Address, Client } from '@/types';

export type ShippingAddressMode = 'none' | 'default' | 'select' | 'new';

interface ShippingAddressSectionProps {
    client: Client | null;
    mode: ShippingAddressMode;
    onModeChange: (mode: ShippingAddressMode) => void;
    selectedAddressIndex: string;
    onSelectedAddressChange: (index: string) => void;
    newAddress: Address;
    onNewAddressChange: (address: Address) => void;
    className?: string;
}

export function ShippingAddressSection({
    client,
    mode,
    onModeChange,
    selectedAddressIndex,
    onSelectedAddressChange,
    newAddress,
    onNewAddressChange,
    className = '',
}: ShippingAddressSectionProps) {
    if (!client) return null;

    const isEnabled = mode !== 'none';

    return (
        <div className={`space-y-2 ${className}`}>
            <div className="flex items-center gap-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Include Shipping Address
                </Label>
                <Switch
                    checked={isEnabled}
                    onCheckedChange={(v: boolean) => onModeChange(v ? 'default' : 'none')}
                    aria-label="Include Shipping Address"
                />
            </div>

            {isEnabled && (
                <div className="space-y-3 border rounded-md p-3 bg-muted/20">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Shipping Address</Label>
                        <Select value={mode} onValueChange={(val: ShippingAddressMode) => onModeChange(val)}>
                            <SelectTrigger className="w-[180px] h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Default Address</SelectItem>
                                {client.shippingAddresses && client.shippingAddresses.length > 0 && (
                                    <SelectItem value="select">Select Saved Address</SelectItem>
                                )}
                                <SelectItem value="new">Add New Address</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Default Address Display */}
                    {mode === 'default' && (
                        <div className="text-sm text-muted-foreground p-2 bg-background rounded border">
                            {client.shippingAddress ? (
                                <>
                                    <p>{client.shippingAddress.street}</p>
                                    <p>
                                        {client.shippingAddress.city}, {client.shippingAddress.state} -{' '}
                                        {client.shippingAddress.pincode}
                                    </p>
                                    <p>{client.shippingAddress.country}</p>
                                </>
                            ) : (
                                <p className="italic">Using billing address as shipping address</p>
                            )}
                        </div>
                    )}

                    {/* Select Saved Address */}
                    {mode === 'select' && client.shippingAddresses && (
                        <Select value={selectedAddressIndex} onValueChange={onSelectedAddressChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an address" />
                            </SelectTrigger>
                            <SelectContent>
                                {client.shippingAddresses.map((addr, idx) => (
                                    <SelectItem key={idx} value={idx.toString()}>
                                        {addr.street}, {addr.city}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* New Address Form */}
                    {mode === 'new' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <FloatingLabelInput
                                id="shipping-street"
                                label="Street"
                                value={newAddress.street}
                                onChange={(e) => onNewAddressChange({ ...newAddress, street: e.target.value })}
                                className="col-span-2"
                            />
                            <FloatingLabelInput
                                id="shipping-city"
                                label="City"
                                value={newAddress.city}
                                onChange={(e) => onNewAddressChange({ ...newAddress, city: e.target.value })}
                            />
                            <FloatingLabelInput
                                id="shipping-state"
                                label="State"
                                value={newAddress.state}
                                onChange={(e) => onNewAddressChange({ ...newAddress, state: e.target.value })}
                            />
                            <FloatingLabelInput
                                id="shipping-pincode"
                                label="Pincode"
                                value={newAddress.pincode}
                                onChange={(e) => onNewAddressChange({ ...newAddress, pincode: e.target.value })}
                            />
                            <FloatingLabelInput
                                id="shipping-country"
                                label="Country"
                                value={newAddress.country}
                                onChange={(e) => onNewAddressChange({ ...newAddress, country: e.target.value })}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ShippingAddressSection;
