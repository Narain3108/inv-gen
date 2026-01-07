/**
 * FooterTab Component
 * Footer settings tab for customization dialog
 */

'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InvoiceCustomization } from '@/types/customization';

interface FooterTabProps {
    customization: InvoiceCustomization;
    onUpdate: (path: string, value: any) => void;
}

export function FooterTab({ customization, onUpdate }: FooterTabProps) {
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Footer Settings</CardTitle>
                    <CardDescription>Customize the footer section</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label>Show Terms and Conditions</Label>
                        <Switch
                            checked={customization.footer.showTermsAndConditions}
                            onCheckedChange={(checked) => onUpdate('footer.showTermsAndConditions', checked)}
                        />
                    </div>

                    {customization.footer.showTermsAndConditions && (
                        <div className="space-y-2">
                            <Label htmlFor="termsText">Terms and Conditions</Label>
                            <Textarea
                                id="termsText"
                                value={customization.footer.termsText}
                                onChange={(e) => onUpdate('footer.termsText', e.target.value)}
                                rows={4}
                                placeholder="Enter your terms and conditions..."
                            />
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                        <Label>Show Signature</Label>
                        <Switch
                            checked={customization.footer.showSignature}
                            onCheckedChange={(checked) => onUpdate('footer.showSignature', checked)}
                        />
                    </div>

                    {customization.footer.showSignature && (
                        <div className="space-y-2">
                            <Label htmlFor="signatureLabel">Signature Label</Label>
                            <Input
                                id="signatureLabel"
                                value={customization.footer.signatureLabel}
                                onChange={(e) => onUpdate('footer.signatureLabel', e.target.value)}
                                placeholder="Authorized Signatory"
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default FooterTab;
