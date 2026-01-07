/**
 * TotalsTab Component
 * Totals section settings tab for customization dialog
 */

'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InvoiceCustomization } from '@/types/customization';

interface TotalsTabProps {
    customization: InvoiceCustomization;
    onUpdate: (path: string, value: any) => void;
}

export function TotalsTab({ customization, onUpdate }: TotalsTabProps) {
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Totals Section</CardTitle>
                    <CardDescription>Choose what to display in the totals section</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {Object.entries({
                        showTaxableAmount: 'Show Taxable Amount',
                        showGSTBreakdown: 'Show GST Breakdown by Rate',
                        showCGST: 'Show CGST',
                        showSGST: 'Show SGST',
                        showIGST: 'Show IGST',
                        showCess: 'Show Cess',
                        showDiscount: 'Show Total Discount',
                        showRoundOff: 'Show Round Off',
                        showAmountInWords: 'Show Amount in Words',
                    }).map(([key, label]) => (
                        <div key={key} className="flex items-center justify-between">
                            <Label>{label}</Label>
                            <Switch
                                checked={customization.totals[key as keyof typeof customization.totals]}
                                onCheckedChange={(checked) => onUpdate(`totals.${key}`, checked)}
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

export default TotalsTab;
