/**
 * FooterTab Component
 * Footer settings tab for customization dialog
 */

'use client';

import React from 'react';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { FloatingLabelTextarea } from '@/components/ui/floating-label-textarea';
import { Label } from '@/components/ui/label';
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
                        <FloatingLabelTextarea
                            id="termsText"
                            label="Terms and Conditions"
                            value={customization.footer.termsText}
                            onChange={(e) => onUpdate('footer.termsText', e.target.value)}
                            rows={4}
                        />
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                        <Label>Show Signature</Label>
                        <Switch
                            checked={customization.footer.showSignature}
                            onCheckedChange={(checked) => onUpdate('footer.showSignature', checked)}
                        />
                    </div>

                    {customization.footer.showSignature && (
                        <FloatingLabelInput
                            id="signatureLabel"
                            label="Signature Label"
                            value={customization.footer.signatureLabel}
                            onChange={(e) => onUpdate('footer.signatureLabel', e.target.value)}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default FooterTab;
