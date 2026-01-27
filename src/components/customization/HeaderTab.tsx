/**
 * HeaderTab Component
 * Header settings tab for customization dialog
 */

'use client';

import React from 'react';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { FloatingLabelSelect } from '@/components/ui/floating-label-select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InvoiceCustomization } from '@/types/customization';

interface HeaderTabProps {
    customization: InvoiceCustomization;
    type: 'invoice' | 'quotation';
    onUpdate: (path: string, value: any) => void;
}

export function HeaderTab({ customization, type, onUpdate }: HeaderTabProps) {
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Header Settings</CardTitle>
                    <CardDescription>Customize the invoice header and title</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FloatingLabelInput
                        id="title"
                        label="Document Title"
                        value={customization.header.title}
                        onChange={(e) => onUpdate('header.title', e.target.value)}
                    />

                    <FloatingLabelSelect
                        id="fontSize"
                        label="Title Size"
                        value={customization.header.fontSize}
                        onValueChange={(value: string) => onUpdate('header.fontSize', value)}
                    >
                        <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                    </FloatingLabelSelect>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FloatingLabelInput
                            id="invoiceNumberLabel"
                            label="Invoice Number Label"
                            value={customization.header.invoiceNumberLabel}
                            onChange={(e) => onUpdate('header.invoiceNumberLabel', e.target.value)}
                        />
                        <div className="flex items-center justify-between pt-8">
                            <Label>Show Invoice Number</Label>
                            <Switch
                                checked={customization.header.showInvoiceNumber}
                                onCheckedChange={(checked) => onUpdate('header.showInvoiceNumber', checked)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FloatingLabelInput
                            id="dateLabel"
                            label="Date Label"
                            value={customization.header.dateLabel}
                            onChange={(e) => onUpdate('header.dateLabel', e.target.value)}
                        />
                        <div className="flex items-center justify-between pt-8">
                            <Label>Show Date</Label>
                            <Switch
                                checked={customization.header.showDate}
                                onCheckedChange={(checked) => onUpdate('header.showDate', checked)}
                            />
                        </div>
                    </div>

                    {type === 'quotation' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FloatingLabelInput
                                id="dueDateLabel"
                                label="Valid Until Label"
                                value={customization.header.dueDateLabel}
                                onChange={(e) => onUpdate('header.dueDateLabel', e.target.value)}
                            />
                            <div className="flex items-center justify-between pt-8">
                                <Label>Show Valid Until</Label>
                                <Switch
                                    checked={customization.header.showDueDate}
                                    onCheckedChange={(checked) => onUpdate('header.showDueDate', checked)}
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Company Details</CardTitle>
                    <CardDescription>Choose what company information to display</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {Object.entries({
                        showLogo: 'Show Logo',
                        showName: 'Show Company Name',
                        showAddress: 'Show Address',
                        showGSTIN: 'Show GSTIN',
                        showPhone: 'Show Phone',
                        showEmail: 'Show Email',
                        showPAN: 'Show PAN',
                        showBankDetails: 'Show Bank Details',
                    }).map(([key, label]) => (
                        <div key={key} className="flex items-center justify-between">
                            <Label>{label}</Label>
                            <Switch
                                checked={customization.companyDetails[key as keyof typeof customization.companyDetails]}
                                onCheckedChange={(checked) => onUpdate(`companyDetails.${key}`, checked)}
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

export default HeaderTab;
