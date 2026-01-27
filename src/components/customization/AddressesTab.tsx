/**
 * AddressesTab Component
 * Address settings tab for customization dialog
 */

'use client';

import React from 'react';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InvoiceCustomization } from '@/types/customization';

interface AddressesTabProps {
    customization: InvoiceCustomization;
    onUpdate: (path: string, value: any) => void;
}

export function AddressesTab({ customization, onUpdate }: AddressesTabProps) {
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Address Settings</CardTitle>
                    <CardDescription>Customize how addresses are displayed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FloatingLabelInput
                            id="billingLabel"
                            label="Billing Address Label"
                            value={customization.addresses.billingLabel}
                            onChange={(e) => onUpdate('addresses.billingLabel', e.target.value)}
                        />
                        <div className="flex items-center justify-between pt-8">
                            <Label>Show Billing Address</Label>
                            <Switch
                                checked={customization.addresses.showBillingAddress}
                                onCheckedChange={(checked) => onUpdate('addresses.showBillingAddress', checked)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FloatingLabelInput
                            id="shippingLabel"
                            label="Shipping Address Label"
                            value={customization.addresses.shippingLabel}
                            onChange={(e) => onUpdate('addresses.shippingLabel', e.target.value)}
                        />
                        <div className="flex items-center justify-between pt-8">
                            <Label>Show Shipping Address</Label>
                            <Switch
                                checked={customization.addresses.showShippingAddress}
                                onCheckedChange={(checked) => onUpdate('addresses.showShippingAddress', checked)}
                            />
                        </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t">
                        <Label className="text-base font-semibold">Address Details</Label>
                        <div className="flex items-center justify-between">
                            <Label>Show GSTIN</Label>
                            <Switch
                                checked={customization.addresses.showGSTIN}
                                onCheckedChange={(checked) => onUpdate('addresses.showGSTIN', checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>Show Phone</Label>
                            <Switch
                                checked={customization.addresses.showPhone}
                                onCheckedChange={(checked) => onUpdate('addresses.showPhone', checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>Show Email</Label>
                            <Switch
                                checked={customization.addresses.showEmail}
                                onCheckedChange={(checked) => onUpdate('addresses.showEmail', checked)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default AddressesTab;
